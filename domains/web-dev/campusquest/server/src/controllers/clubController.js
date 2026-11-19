import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Event } from '../models/Event.js';
import { Challenge } from '../models/Challenge.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { escapeRegex, slugify } from '../utils/helpers.js';
import { createNotification, notifyMany } from '../services/notificationService.js';
import { awardPoints } from '../services/pointsService.js';

export async function assertClubManager(club, user) {
  if (user.role === 'admin') return true;
  if (String(club.organizer) === String(user._id)) return true;
  throw ApiError.forbidden('Only this club organizer can manage the club');
}

function clubFilterForUser(user) {
  if (user?.role === 'admin') return {};
  return { status: 'approved' };
}

export const listClubs = asyncHandler(async (req, res) => {
  const { q, category, mine } = req.query;
  const pagination = parsePagination(req.query, { limit: 12 });
  const filter = { ...clubFilterForUser(req.user) };

  if (mine === 'true') {
    if (!req.user) throw ApiError.unauthorized();
    filter.organizer = req.user._id;
    delete filter.status;
  }
  if (category) filter.category = category;
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { tagline: regex }];
  }

  const [items, total] = await Promise.all([
    Club.find(filter)
      .populate('organizer', 'name avatarUrl')
      .sort({ membersCount: -1, name: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Club.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const getClub = asyncHandler(async (req, res) => {
  const byId = /^[a-f\d]{24}$/i.test(req.params.slug);
  const club = await Club.findOne(byId ? { _id: req.params.slug } : { slug: req.params.slug }).populate(
    'organizer',
    'name avatarUrl bio',
  );
  if (!club) throw ApiError.notFound('Club not found');
  if (club.status !== 'approved' && (!req.user || !['organizer', 'admin'].includes(req.user.role))) {
    throw ApiError.notFound('Club not found');
  }

  const [memberships, events, challenges] = await Promise.all([
    ClubMembership.find({ club: club._id, status: 'approved' })
      .populate('user', 'name avatarUrl department year points')
      .sort({ createdAt: 1 }),
    Event.find({ club: club._id, status: 'published' }).sort({ startDate: 1 }).limit(6),
    Challenge.find({ club: club._id, status: 'published' }).sort({ deadline: 1 }).limit(6),
  ]);

  let myMembership = null;
  if (req.user) {
    myMembership = await ClubMembership.findOne({ club: club._id, user: req.user._id });
  }

  return sendSuccess(res, {
    club,
    members: memberships,
    events,
    challenges,
    myMembership,
    canManage: Boolean(req.user && (req.user.role === 'admin' || String(club.organizer?._id) === String(req.user._id))),
  });
});

export const createClub = asyncHandler(async (req, res) => {
  const existing = await Club.findOne({ name: new RegExp(`^${escapeRegex(req.body.name)}$`, 'i') });
  if (existing) throw ApiError.conflict('A club with that name already exists');

  const club = await Club.create({
    ...req.body,
    slug: `${slugify(req.body.name)}-${Math.random().toString(36).slice(2, 6)}`,
    organizer: req.user._id,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    membersCount: 1,
    activity: [{ actor: req.user._id, message: `${req.user.name} created the club`, kind: 'created' }],
  });

  await ClubMembership.create({
    club: club._id,
    user: req.user._id,
    role: 'organizer',
    status: 'approved',
    decidedBy: req.user._id,
    decidedAt: new Date(),
  });

  return sendSuccess(res, { club }, 201);
});

export const updateClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  await assertClubManager(club, req.user);
  Object.assign(club, req.body);
  club.activity.push({ actor: req.user._id, message: `${req.user.name} updated club details`, kind: 'update' });
  await club.save();
  return sendSuccess(res, { club });
});

export const requestMembership = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  if (club.status !== 'approved') throw ApiError.badRequest('This club is not accepting members yet');
  if (String(club.organizer) === String(req.user._id)) throw ApiError.badRequest('You already organize this club');

  const existing = await ClubMembership.findOne({ club: club._id, user: req.user._id });
  if (existing && existing.status === 'approved') throw ApiError.conflict('You are already a member');
  if (existing && existing.status === 'pending') throw ApiError.conflict('Your request is already pending');

  let membership;
  if (existing) {
    existing.status = 'pending';
    existing.message = req.body.message || '';
    existing.decidedBy = null;
    existing.decidedAt = null;
    membership = await existing.save();
  } else {
    membership = await ClubMembership.create({
      club: club._id,
      user: req.user._id,
      message: req.body.message || '',
    });
  }

  await createNotification({
    user: club.organizer,
    type: 'club',
    title: 'New membership request',
    message: `${req.user.name} requested to join ${club.name}.`,
    link: `/organizer/clubs/${club._id}`,
  });

  return sendSuccess(res, { membership }, 201);
});

export const decideMembership = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  await assertClubManager(club, req.user);

  const membership = await ClubMembership.findOne({ club: club._id, user: req.params.userId });
  if (!membership) throw ApiError.notFound('Membership request not found');
  if (membership.status === 'approved' && req.body.decision === 'approved') {
    throw ApiError.conflict('Member is already approved');
  }

  const wasApproved = membership.status === 'approved';
  membership.status = req.body.decision;
  membership.decidedBy = req.user._id;
  membership.decidedAt = new Date();
  await membership.save();

  if (req.body.decision === 'approved' && !wasApproved) {
    await Club.updateOne({ _id: club._id }, { $inc: { membersCount: 1 } });
    await awardPoints({
      userId: membership.user,
      amount: 5,
      type: 'club_join',
      reason: `Joined ${club.name}`,
      sourceType: 'club',
      sourceId: club._id,
      idempotencyKey: `club-join:${club._id}:${membership.user}`,
    }).catch(() => null);
  } else if (req.body.decision === 'rejected' && wasApproved) {
    await Club.updateOne({ _id: club._id }, { $inc: { membersCount: -1 } });
  }

  club.activity.push({
    actor: req.user._id,
    message: `${req.user.name} ${req.body.decision} a membership request`,
    kind: 'membership',
  });
  await club.save();

  await createNotification({
    user: membership.user,
    type: 'club',
    title: `Membership ${req.body.decision}`,
    message:
      req.body.decision === 'approved'
        ? `You are now a member of ${club.name}.`
        : `Your request to join ${club.name} was not approved.`,
    link: `/clubs/${club.slug}`,
  });

  return sendSuccess(res, { membership });
});

export const listMembershipRequests = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  await assertClubManager(club, req.user);

  const requests = await ClubMembership.find({ club: club._id, status: 'pending' })
    .populate('user', 'name email avatarUrl department year')
    .sort({ createdAt: 1 });
  return sendSuccess(res, { requests });
});

export const leaveClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  if (String(club.organizer) === String(req.user._id)) {
    throw ApiError.badRequest('Club organizers must transfer or archive their club instead');
  }
  const membership = await ClubMembership.findOne({ club: club._id, user: req.user._id });
  if (!membership || membership.status !== 'approved') throw ApiError.badRequest('You are not a member');

  membership.status = 'left';
  await membership.save();
  await Club.updateOne({ _id: club._id }, { $inc: { membersCount: -1 } });
  club.activity.push({ actor: req.user._id, message: `${req.user.name} left the club`, kind: 'membership' });
  await club.save();
  return sendSuccess(res, { message: 'You left the club' });
});

export const listMyClubs = asyncHandler(async (req, res) => {
  const memberships = await ClubMembership.find({ user: req.user._id, status: 'approved' })
    .populate('club')
    .sort({ createdAt: -1 });
  return sendSuccess(res, memberships);
});

export const listClubMembers = asyncHandler(async (req, res) => {
  const memberships = await ClubMembership.find({ club: req.params.id, status: 'approved' })
    .populate('user', 'name email avatarUrl department year points')
    .sort({ role: 1, createdAt: 1 });
  return sendSuccess(res, memberships);
});

export const getClubActivity = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id).populate('activity.actor', 'name avatarUrl');
  if (!club) throw ApiError.notFound('Club not found');
  return sendSuccess(res, club.activity.slice(-30).reverse());
});

export const adminListClubs = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Club.find(filter)
      .populate('organizer', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Club.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const adminReviewClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  const decision = req.body.decision;
  if (!['approved', 'rejected'].includes(decision)) throw ApiError.badRequest('Invalid decision');

  club.status = decision;
  club.rejectionReason = decision === 'rejected' ? req.body.reason || 'Does not meet club guidelines' : '';
  club.activity.push({
    actor: req.user._id,
    message: `Club ${decision} by platform admin`,
    kind: 'moderation',
  });
  await club.save();

  await createNotification({
    user: club.organizer,
    type: 'club',
    title: `Club ${decision}`,
    message:
      decision === 'approved'
        ? `${club.name} is now live on CampusQuest.`
        : `${club.name} was not approved: ${club.rejectionReason}`,
    link: `/clubs/${club.slug}`,
  });

  return sendSuccess(res, { club });
});

export const archiveClub = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw ApiError.notFound('Club not found');
  await assertClubManager(club, req.user);
  club.status = 'archived';
  await club.save();
  await notifyMany(
    (await ClubMembership.find({ club: club._id, status: 'approved' }).select('user')).map((entry) => entry.user),
    {
      type: 'club',
      title: `${club.name} archived`,
      message: 'The club organizer has archived this club.',
      link: '/clubs',
    },
  );
  return sendSuccess(res, { club });
});
