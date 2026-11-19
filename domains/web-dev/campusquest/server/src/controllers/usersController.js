import { User } from '../models/User.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Team } from '../models/Team.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Attendance } from '../models/Attendance.js';
import { Submission } from '../models/Submission.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { LEVELS, levelForXp } from '../config/constants.js';
import { approvedProgressForUser } from '../services/challengeService.js';
import { userRank } from '../services/leaderboardService.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'campus', 'department', 'year', 'avatarUrl', 'preferences'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (key === 'preferences') {
        req.user.preferences = req.body.preferences;
      } else {
        req.user[key] = req.body[key];
      }
    }
  }
  await req.user.save();
  return sendSuccess(res, { user: req.user.toJSON() });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name avatarUrl bio campus department year role points xp level levelTitle streak longestStreak createdAt',
  );
  if (!user) throw ApiError.notFound('Student not found');

  const [achievements, clubs, teams, rank] = await Promise.all([
    UserAchievement.find({ user: user._id }).populate('achievement').sort({ unlockedAt: -1 }).limit(12),
    ClubMembership.find({ user: user._id, status: 'approved' }).populate('club', 'name logoUrl category'),
    Team.find({ members: user._id, status: 'active' }).select('name membersCount points'),
    userRank(user._id),
  ]);

  return sendSuccess(res, {
    user,
    achievements,
    clubs: clubs.map((membership) => membership.club).filter(Boolean),
    teams,
    rank,
  });
});

export const getMyStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const teams = await Team.find({ members: user._id, status: 'active' }).select('_id');
  const teamIds = teams.map((team) => team._id);

  const [registrations, attended, clubs, participations, approved, achievements, teamsLed, rank, progress] =
    await Promise.all([
      EventRegistration.countDocuments({ user: user._id, status: { $in: ['registered', 'checked_in'] } }),
      Attendance.countDocuments({ user: user._id }),
      ClubMembership.countDocuments({ user: user._id, status: 'approved' }),
      ChallengeParticipation.countDocuments({
        $or: [{ user: user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])],
      }),
      ChallengeParticipation.countDocuments({
        status: 'approved',
        $or: [{ user: user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])],
      }),
      UserAchievement.countDocuments({ user: user._id }),
      Team.countDocuments({ leader: user._id, status: 'active' }),
      userRank(user._id),
      approvedProgressForUser(user),
    ]);

  const nextLevel = LEVELS.find((entry) => entry.minXp > user.xp) || null;
  const currentLevel = levelForXp(user.xp);
  const levelSpan = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1;
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((user.xp - currentLevel.minXp) / levelSpan) * 1000) / 10)
    : 100;

  return sendSuccess(res, {
    stats: {
      registrations,
      attended,
      clubs,
      participations,
      approved,
      achievements,
      teamsLed,
      points: user.points,
      xp: user.xp,
      level: currentLevel.level,
      levelTitle: currentLevel.title,
      levelProgress,
      nextLevelAt: nextLevel?.minXp ?? null,
      streak: user.streak,
      rank: rank?.rank ?? null,
      challengeProgress: progress,
    },
  });
});

export const getMyPoints = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 15 });
  const [items, total] = await Promise.all([
    PointTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    PointTransaction.countDocuments({ user: req.user._id }),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 12 });
  const filter = { submittedBy: req.user._id };
  const [items, total] = await Promise.all([
    Submission.find(filter)
      .populate('challenge', 'title category difficulty rewardPoints deadline')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Submission.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});
