import { Challenge } from '../models/Challenge.js';
import { Club } from '../models/Club.js';
import { Team } from '../models/Team.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Submission } from '../models/Submission.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { escapeRegex } from '../utils/helpers.js';
import { joinChallenge } from '../services/challengeService.js';
import { createNotification } from '../services/notificationService.js';

async function assertChallengeManager(challenge, user) {
  if (user.role === 'admin') return true;
  if (String(challenge.organizer) === String(user._id)) return true;
  if (challenge.club) {
    const club = await Club.findById(challenge.club).select('organizer');
    if (club && String(club.organizer) === String(user._id)) return true;
  }
  throw ApiError.forbidden('Only the challenge organizer can manage this challenge');
}

function buildChallengeFilter(query) {
  const { q, category, difficulty, type, status, open } = query;
  const filter = {};
  filter.status = status || 'published';
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;
  if (open === 'true') {
    if (status !== 'draft' && status !== 'closed') filter.deadline = { $gte: new Date() };
  }
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }
  return filter;
}

export const listChallenges = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 12 });
  const filter = buildChallengeFilter(req.query);
  if (req.query.mine === 'true') {
    if (!req.user) throw ApiError.unauthorized();
    filter.organizer = req.user._id;
    if (!req.query.status) filter.status = undefined;
  }

  const [items, total] = await Promise.all([
    Challenge.find(filter)
      .populate('organizer', 'name avatarUrl')
      .populate('club', 'name logoUrl slug')
      .sort({ deadline: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Challenge.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const getChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate('organizer', 'name avatarUrl role')
    .populate('club', 'name logoUrl slug organizer');
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status === 'draft' && (!req.user || !['organizer', 'admin'].includes(req.user.role))) {
    throw ApiError.notFound('Challenge not found');
  }

  let participation = null;
  let submissions = [];
  let team = null;
  if (req.user) {
    if (challenge.type === 'team') {
      team = await Team.findOne({ members: req.user._id, status: 'active' }).populate('members', 'name avatarUrl points');
      if (team) participation = await ChallengeParticipation.findOne({ challenge: challenge._id, team: team._id });
    } else {
      participation = await ChallengeParticipation.findOne({ challenge: challenge._id, user: req.user._id });
    }
    if (participation) {
      submissions = await Submission.find({
        participation: participation._id,
        ...(challenge.type === 'team' ? {} : { submittedBy: req.user._id }),
      }).sort({ createdAt: -1 });
    }
  }

  const approvedCount = await ChallengeParticipation.countDocuments({ challenge: challenge._id, status: 'approved' });
  return sendSuccess(res, { challenge, participation, submissions, team, approvedCount });
});

export const createChallenge = asyncHandler(async (req, res) => {
  if (req.body.club) {
    const club = await Club.findById(req.body.club);
    if (!club || club.status !== 'approved') throw ApiError.badRequest('Select an approved club');
    if (req.user.role !== 'admin' && String(club.organizer) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only create challenges for clubs you organize');
    }
  }
  const challenge = await Challenge.create({
    ...req.body,
    organizer: req.user._id,
    status: req.body.status || 'draft',
  });
  return sendSuccess(res, { challenge }, 201);
});

export const updateChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  await assertChallengeManager(challenge, req.user);
  Object.assign(challenge, req.body);
  if (new Date(challenge.deadline) <= new Date(challenge.startDate)) {
    throw ApiError.badRequest('Deadline must be after the start date');
  }
  await challenge.save();
  return sendSuccess(res, { challenge });
});

export const closeChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  await assertChallengeManager(challenge, req.user);
  challenge.status = 'closed';
  await challenge.save();

  const participations = await ChallengeParticipation.find({ challenge: challenge._id }).select('user team');
  const userIds = new Set();
  participations.forEach((entry) => {
    if (entry.user) userIds.add(String(entry.user));
    if (entry.team) userIds.add(`team:${entry.team}`);
  });
  for (const entry of participations.filter((item) => item.user)) {
    await createNotification({
      user: entry.user,
      type: 'challenge_deadline',
      title: `Challenge closed: ${challenge.title}`,
      message: 'This challenge is now closed for new submissions.',
      link: `/challenges/${challenge._id}`,
    });
  }
  return sendSuccess(res, { challenge });
});

export const join = asyncHandler(async (req, res) => {
  const result = await joinChallenge({ challengeId: req.params.id, userId: req.user._id });
  return sendSuccess(res, result, 201);
});

export const myParticipations = asyncHandler(async (req, res) => {
  const teams = await Team.find({ members: req.user._id }).select('_id');
  const teamIds = teams.map((team) => team._id);
  const filter = { $or: [{ user: req.user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])] };
  if (req.query.status) filter.status = req.query.status;

  const participations = await ChallengeParticipation.find(filter)
    .populate('challenge', 'title category difficulty type rewardPoints deadline status coverUrl')
    .populate('team', 'name')
    .sort({ createdAt: -1 });

  const submissionCounts = await Submission.aggregate([
    { $match: { participation: { $in: participations.map((entry) => entry._id) } } },
    { $group: { _id: '$participation', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(submissionCounts.map((entry) => [String(entry._id), entry.count]));
  return sendSuccess(
    res,
    participations.map((entry) => ({ ...entry.toJSON(), submissionCount: countMap.get(String(entry._id)) || 0 })),
  );
});

export const listParticipants = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  await assertChallengeManager(challenge, req.user);

  const participations = await ChallengeParticipation.find({ challenge: challenge._id })
    .populate('user', 'name email avatarUrl department year points')
    .populate('team', 'name membersCount maxSize')
    .populate({
      path: 'challenge',
      select: 'title',
    })
    .sort({ createdAt: 1 });

  const submissionCounts = await Submission.aggregate([
    { $match: { challenge: challenge._id } },
    { $group: { _id: '$participation', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(submissionCounts.map((entry) => [String(entry._id), entry.count]));

  return sendSuccess(res, {
    challenge,
    participants: participations.map((entry) => ({
      ...entry.toJSON(),
      submissionCount: countMap.get(String(entry._id)) || 0,
    })),
  });
});
