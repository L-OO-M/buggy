import { Submission } from '../models/Submission.js';
import { Challenge } from '../models/Challenge.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Team } from '../models/Team.js';
import { Club } from '../models/Club.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { awardPoints, reversePoints } from '../services/pointsService.js';
import { createNotification, notifyMany } from '../services/notificationService.js';
import { refreshParticipationStatus } from '../services/challengeService.js';
import { reconcileAchievements, evaluateAchievements } from '../services/achievementService.js';
import { emitToRoom } from '../sockets/emitter.js';

async function assertChallengeManager(challenge, user) {
  if (user.role === 'admin') return true;
  if (String(challenge.organizer) === String(user._id)) return true;
  if (challenge.club) {
    const club = await Club.findById(challenge.club).select('organizer');
    if (club && String(club.organizer) === String(user._id)) return true;
  }
  throw ApiError.forbidden('Only the challenge organizer can review this submission');
}

async function resolveRecipients(challenge, participation, submission) {
  if (challenge.type === 'team' && participation.team) {
    const team = await Team.findById(participation.team).select('members');
    return team ? team.members.map(String) : [String(submission.submittedBy)];
  }
  return [String(participation.user || submission.submittedBy)];
}

export const createSubmission = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.body.challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status !== 'published') throw ApiError.badRequest('This challenge is not accepting submissions');
  const now = new Date();
  if (now < new Date(challenge.startDate)) throw ApiError.badRequest('This challenge has not started yet');
  if (now > new Date(new Date(challenge.deadline).getTime() + 24 * 60 * 60 * 1000)) {
    throw ApiError.badRequest('The deadline for this challenge has passed');
  }

  let participation;
  if (challenge.type === 'team') {
    const team = await Team.findOne({ members: req.user._id, status: 'active' });
    if (!team) throw ApiError.badRequest('You need an active team to submit for this challenge');
    participation = await ChallengeParticipation.findOne({ challenge: challenge._id, team: team._id });
    if (!participation) throw ApiError.badRequest('Join this challenge with your team before submitting');
  } else {
    participation = await ChallengeParticipation.findOne({ challenge: challenge._id, user: req.user._id });
    if (!participation) throw ApiError.badRequest('Join this challenge before submitting evidence');
  }

  const previous = await Submission.find({ participation: participation._id }).sort({ createdAt: -1 });
  const active = previous.find((entry) => entry.status === 'pending');
  if (active) {
    throw ApiError.conflict('This submission is already awaiting review or has been approved');
  }
  const last = previous[0];
  if (last && last.status === 'rejected' && !challenge.allowResubmission) {
    throw ApiError.badRequest('Resubmission is not allowed for this challenge');
  }

  const submission = await Submission.create({
    challenge: challenge._id,
    participation: participation._id,
    submittedBy: req.user._id,
    team: participation.team || null,
    attempt: previous.length + 1,
    evidence: { note: req.body.note, url: req.body.url || '' },
  });

  participation.status = 'submitted';
  participation.lastSubmissionAt = new Date();
  await participation.save();

  await createNotification({
    user: challenge.organizer,
    type: 'submission_status',
    title: 'New challenge submission',
    message: `${req.user.name} submitted evidence for ${challenge.title}.`,
    link: `/organizer/submissions`,
    meta: { submissionId: String(submission._id), challengeId: String(challenge._id) },
  });

  emitToRoom(`challenge:${challenge._id}`, 'submission:update', {
    challengeId: String(challenge._id),
    status: 'pending',
  });

  return sendSuccess(res, { submission }, 201);
});

export const listMySubmissions = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 12 });
  const teams = await Team.find({ members: req.user._id }).select('_id');
  const filter = {
    $or: [{ submittedBy: req.user._id }, ...(teams.length ? [{ team: { $in: teams.map((team) => team._id) } }] : [])],
  };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Submission.find(filter)
      .populate('challenge', 'title category difficulty type rewardPoints deadline status')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Submission.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('challenge')
    .populate('submittedBy', 'name email avatarUrl')
    .populate('team', 'name members')
    .populate('reviewedBy', 'name');
  if (!submission) throw ApiError.notFound('Submission not found');

  const isOwner = String(submission.submittedBy?._id) === String(req.user._id);
  const isTeamMember =
    submission.team?.members?.some((member) => String(member) === String(req.user._id)) || false;
  if (!isOwner && !isTeamMember && !['organizer', 'admin'].includes(req.user.role)) {
    throw ApiError.forbidden('You cannot view this submission');
  }
  return sendSuccess(res, { submission });
});

export const reviewQueue = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  let challengeIds;
  if (req.user.role !== 'admin') {
    const clubs = await Club.find({ organizer: req.user._id }).select('_id');
    const challenges = await Challenge.find({
      $or: [{ organizer: req.user._id }, ...(clubs.length ? [{ club: { $in: clubs.map((club) => club._id) } }] : [])],
    }).select('_id');
    challengeIds = challenges.map((challenge) => challenge._id);
  }

  const filter = { status: req.query.status || 'pending' };
  if (challengeIds) filter.challenge = { $in: challengeIds };
  if (req.query.challenge) filter.challenge = req.query.challenge;

  const [items, total] = await Promise.all([
    Submission.find(filter)
      .populate('challenge', 'title rewardPoints type category difficulty')
      .populate('submittedBy', 'name email avatarUrl')
      .populate('team', 'name membersCount')
      .sort({ createdAt: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Submission.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('challenge');
  if (!submission) throw ApiError.notFound('Submission not found');
  const challenge = submission.challenge;
  await assertChallengeManager(challenge, req.user);

  if (submission.status !== 'pending') {
    throw ApiError.badRequest('Only pending submissions can be reviewed');
  }

  const participation = await ChallengeParticipation.findById(submission.participation);
  if (!participation) throw ApiError.notFound('Participation record not found');
  const recipients = await resolveRecipients(challenge, participation, submission);

  submission.status = req.body.decision;
  submission.feedback = req.body.feedback || '';
  submission.reviewedBy = req.user._id;
  submission.reviewedAt = new Date();

  if (req.body.decision === 'approved') {
    const awards = await Promise.all(
      recipients.map((userId) =>
        awardPoints({
          userId,
          amount: challenge.xpReward,
          type: 'challenge_reward',
          reason: `Challenge approved: ${challenge.title}`,
          sourceType: 'challenge',
          sourceId: challenge._id,
          idempotencyKey: `challenge-reward:${submission._id}:${userId}`,
          createdBy: req.user._id,
          skipSideEffects: true,
        }),
      ),
    );
    submission.pointsAwarded = challenge.rewardPoints * recipients.length;
    participation.status = 'approved';
    participation.approvedAt = new Date();
    participation.pointsAwarded = submission.pointsAwarded;
    await participation.save();
    await Promise.all(recipients.map((userId) => evaluateAchievements(userId)));
    void awards;
  } else {
    participation.status = 'rejected';
    await participation.save();
  }

  await submission.save();
  await refreshParticipationStatus(participation._id);

  await notifyMany(recipients, {
    type: 'submission_status',
    title: `Submission ${req.body.decision}`,
    message:
      req.body.decision === 'approved'
        ? `Your evidence for ${challenge.title} was approved. +${challenge.rewardPoints} points per participant.`
        : `Your evidence for ${challenge.title} was rejected. ${req.body.feedback || ''}`.trim(),
    link: '/submissions',
  });

  emitToRoom(`challenge:${challenge._id}`, 'submission:update', {
    challengeId: String(challenge._id),
    submissionId: String(submission._id),
    status: submission.status,
  });
  emitToRoom(`user:${submission.submittedBy}`, 'submission:update', {
    submissionId: String(submission._id),
    status: submission.status,
  });

  return sendSuccess(res, { submission });
});

export const revokeSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('challenge');
  if (!submission) throw ApiError.notFound('Submission not found');
  await assertChallengeManager(submission.challenge, req.user);
  if (submission.status !== 'approved') throw ApiError.badRequest('Only approved submissions can be revoked');

  const participation = await ChallengeParticipation.findById(submission.participation);
  const recipients = participation
    ? await resolveRecipients(submission.challenge, participation, submission)
    : [String(submission.submittedBy)];

  await Promise.all(
    recipients.map((userId) =>
      reversePoints({
        userId,
        amount: submission.challenge.rewardPoints,
        reason: `Submission revoked: ${submission.challenge.title}`,
        sourceType: 'submission',
        sourceId: submission._id,
        idempotencyKey: `submission-revoke:${submission._id}:${userId}`,
        createdBy: req.user._id,
      }),
    ),
  );

  submission.status = 'rejected';
  submission.revokedAt = new Date();
  submission.feedback = req.body.reason || 'Approval revoked after review.';
  submission.pointsAwarded = 0;
  await submission.save();

  if (participation) {
    participation.status = 'rejected';
    participation.pointsAwarded = 0;
    participation.approvedAt = null;
    await participation.save();
  }

  await Promise.all(recipients.map(() => reconcileAchievements(submission._id)));

  await notifyMany(recipients, {
    type: 'submission_status',
    title: 'Submission approval revoked',
    message: `The approval for ${submission.challenge.title} was revoked. ${req.body.reason || ''}`.trim(),
    link: '/submissions',
  });

  return sendSuccess(res, { submission });
});
