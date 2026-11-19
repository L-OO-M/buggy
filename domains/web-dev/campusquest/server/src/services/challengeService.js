import { Challenge } from '../models/Challenge.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Submission } from '../models/Submission.js';
import { Team } from '../models/Team.js';
import { ApiError } from '../utils/http.js';

export async function joinChallenge({ challengeId, userId }) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status !== 'published') throw ApiError.badRequest('This challenge is not open for participation');
  if (new Date(challenge.deadline) < new Date()) throw ApiError.badRequest('The registration deadline has passed');
  if (new Date(challenge.startDate) > new Date()) throw ApiError.badRequest('This challenge has not started yet');

  let participantKey = `challenge:${challenge._id}:user:${userId}`;
  let teamId = null;
  if (challenge.type === 'team') {
    const team = await Team.findOne({ members: userId, status: 'active' });
    if (!team) throw ApiError.badRequest('Join or create a team before entering a team challenge');
    teamId = team._id;
    participantKey = `challenge:${challenge._id}:team:${team._id}`;
  }

  const existing = await ChallengeParticipation.findOne({ participantKey });
  if (existing && existing.status !== 'withdrawn') {
    throw ApiError.conflict('You have already joined this challenge');
  }

  const claimed = await Challenge.findOneAndUpdate(
    {
      _id: challenge._id,
      status: 'published',
      $expr: { $lte: ['$participationCount', '$maxParticipants'] },
    },
    { $inc: { participationCount: 1 } },
    { new: true },
  );
  if (!claimed) throw ApiError.conflict('This challenge is full');

  try {
    const participation = await ChallengeParticipation.findOneAndUpdate(
      { participantKey },
      {
        $set: { status: 'active' },
        $setOnInsert: { challenge: challenge._id, user: teamId ? null : userId, team: teamId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { participation, challenge: claimed };
  } catch (error) {
    await Challenge.updateOne({ _id: challenge._id }, { $inc: { participationCount: -1 } });
    throw error;
  }
}

export async function approvedProgressForUser(user) {
  const teams = await Team.find({ members: user._id }).select('_id');
  const teamIds = teams.map((team) => team._id);
  const [joined, completed] = await Promise.all([
    ChallengeParticipation.countDocuments({
      status: { $in: ['active', 'submitted', 'approved', 'rejected'] },
      $or: [{ user: user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])],
    }),
    ChallengeParticipation.countDocuments({
      status: 'approved',
      user: user._id,
    }),
  ]);
  const percent = joined === 0 ? 0 : Math.round((completed / joined) * 1000) / 10;
  return { joined, completed, percent };
}

export async function refreshParticipationStatus(participationId) {
  const participation = await ChallengeParticipation.findById(participationId);
  if (!participation) return null;
  const latest = await Submission.findOne({ participation: participationId }).sort({ createdAt: -1 });
  if (!latest) return participation;
  participation.status =
    latest.status === 'approved' ? 'approved' : latest.status === 'rejected' ? 'rejected' : 'submitted';
  participation.lastSubmissionAt = latest.createdAt;
  if (latest.status === 'approved') participation.approvedAt = latest.reviewedAt || new Date();
  await participation.save();
  return participation;
}
