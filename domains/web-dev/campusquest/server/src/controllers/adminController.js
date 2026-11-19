import { User } from '../models/User.js';
import { Club } from '../models/Club.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Challenge } from '../models/Challenge.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Submission } from '../models/Submission.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { Achievement } from '../models/Achievement.js';
import { Report } from '../models/Report.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { escapeRegex } from '../utils/helpers.js';
import { awardPoints } from '../services/pointsService.js';
import { evaluateAchievements } from '../services/achievementService.js';

export const platformStats = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const [
    students,
    organizers,
    admins,
    activeClubs,
    pendingClubs,
    events,
    publishedEvents,
    registrations,
    attendance,
    challenges,
    participations,
    submissionStats,
    pointsDistributed,
    achievementsUnlocked,
    openReports,
    weeklyRegistrations,
    pointsByType,
    recentRegistrations,
    recentSubmissions,
    recentClubs,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', suspended: false }),
    User.countDocuments({ role: 'organizer', suspended: false }),
    User.countDocuments({ role: 'admin', suspended: false }),
    Club.countDocuments({ status: 'approved' }),
    Club.countDocuments({ status: 'pending' }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    EventRegistration.countDocuments({ status: { $in: ['registered', 'checked_in'] } }),
    EventRegistration.countDocuments({ status: 'checked_in' }),
    Challenge.countDocuments(),
    ChallengeParticipation.countDocuments(),
    Submission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    PointTransaction.aggregate([{ $match: { amount: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    UserAchievement.countDocuments(),
    Report.countDocuments({ status: { $in: ['open', 'reviewing'] } }),
    EventRegistration.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    PointTransaction.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    EventRegistration.find()
      .populate('user', 'name')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(6),
    Submission.find()
      .populate('submittedBy', 'name')
      .populate('challenge', 'title')
      .sort({ createdAt: -1 })
      .limit(6),
    Club.find().populate('organizer', 'name').sort({ createdAt: -1 }).limit(6).select('name status createdAt'),
  ]);

  const submissions = { pending: 0, approved: 0, rejected: 0 };
  submissionStats.forEach((entry) => {
    submissions[entry._id] = entry.count;
  });

  return sendSuccess(res, {
    users: { students, organizers, admins, total: students + organizers + admins },
    clubs: { active: activeClubs, pending: pendingClubs },
    events: { total: events, published: publishedEvents, registrations, attendance },
    challenges: { total: challenges, participations },
    submissions,
    pointsDistributed: pointsDistributed[0]?.total || 0,
    achievementsUnlocked,
    openReports,
    weeklyRegistrations,
    pointsByType,
    activity: {
      registrations: recentRegistrations,
      submissions: recentSubmissions,
      clubs: recentClubs,
    },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.suspended === 'true') filter.suspended = true;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { campus: regex }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (String(user._id) === String(req.user._id) && (req.body.suspended || req.body.role)) {
    throw ApiError.badRequest('You cannot change your own role or suspend your own account');
  }
  if (req.body.role) user.role = req.body.role;
  if (req.body.suspended !== undefined) {
    user.suspended = req.body.suspended;
    user.suspendedReason = req.body.suspended ? req.body.suspendedReason || 'Policy violation' : '';
  }
  await user.save();
  return sendSuccess(res, { user: user.toJSON() });
});

export const listAllEvents = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.title = new RegExp(escapeRegex(req.query.q), 'i');
  const [items, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'name email')
      .populate('club', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Event.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const moderateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (req.body.status) event.status = req.body.status;
  if (req.body.moderationNote !== undefined) event.moderationNote = req.body.moderationNote;
  await event.save();
  return sendSuccess(res, { event });
});

export const listAllChallenges = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.title = new RegExp(escapeRegex(req.query.q), 'i');
  const [items, total] = await Promise.all([
    Challenge.find(filter)
      .populate('organizer', 'name email')
      .populate('club', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Challenge.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const moderateChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (req.body.status) challenge.status = req.body.status;
  if (req.body.moderationNote !== undefined) challenge.moderationNote = req.body.moderationNote;
  await challenge.save();
  return sendSuccess(res, { challenge });
});

export const listAllSubmissions = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Submission.find(filter)
      .populate('challenge', 'title rewardPoints type')
      .populate('submittedBy', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Submission.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const listAchievements = asyncHandler(async (_req, res) => {
  const achievements = await Achievement.find().sort({ criteriaType: 1, threshold: 1 });
  return sendSuccess(res, achievements);
});

export const upsertAchievement = asyncHandler(async (req, res) => {
  const { code, title, description, icon, category, criteriaType, threshold, bonusPoints, active } = req.body;
  if (!code || !title || !criteriaType || threshold === undefined) {
    throw ApiError.badRequest('Code, title, criteria and threshold are required');
  }
  const achievement = await Achievement.findOneAndUpdate(
    { code },
    { code, title, description, icon, category, criteriaType, threshold, bonusPoints, active },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return sendSuccess(res, { achievement }, 201);
});

export const adjustPoints = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) throw ApiError.notFound('User not found');
  const result = await awardPoints({
    userId: user._id,
    amount: req.body.amount,
    type: req.body.amount > 0 ? 'adjustment' : 'adjustment',
    reason: req.body.reason,
    sourceType: 'admin_adjustment',
    idempotencyKey: `admin-adjust:${req.user._id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    createdBy: req.user._id,
    skipSideEffects: true,
  });
  await evaluateAchievements(user._id);
  return sendSuccess(res, { transaction: result.transaction, user: result.user?.toJSON?.() || result.user });
});

export const listPointTransactions = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.user) filter.user = req.query.user;
  if (req.query.type) filter.type = req.query.type;
  const [items, total] = await Promise.all([
    PointTransaction.find(filter)
      .populate('user', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    PointTransaction.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const clubOverview = asyncHandler(async (_req, res) => {
  const [clubs, memberships] = await Promise.all([
    Club.countDocuments(),
    ClubMembership.countDocuments({ status: 'approved' }),
  ]);
  return sendSuccess(res, { clubs, memberships });
});
