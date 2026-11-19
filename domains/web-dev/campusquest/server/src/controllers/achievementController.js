import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Attendance } from '../models/Attendance.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Team } from '../models/Team.js';
import { asyncHandler, sendSuccess } from '../utils/http.js';
import { evaluateAchievements } from '../services/achievementService.js';

async function currentMetrics(user) {
  const teams = await Team.find({ members: user._id }).select('_id');
  const teamIds = teams.map((team) => team._id);
  const [challenges, events, clubs, teamsLed] = await Promise.all([
    ChallengeParticipation.countDocuments({
      status: 'approved',
      $or: [{ user: user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])],
    }),
    Attendance.countDocuments({ user: user._id }),
    ClubMembership.countDocuments({ user: user._id, status: 'approved' }),
    Team.countDocuments({ leader: user._id }),
  ]);
  return {
    points: user.points,
    challenges_completed: challenges,
    events_attended: events,
    clubs_joined: clubs,
    teams_created: teamsLed,
    streak: user.streak,
  };
}

export const listAchievements = asyncHandler(async (req, res) => {
  const [achievements, owned, metrics] = await Promise.all([
    Achievement.find({ active: true }).sort({ threshold: 1 }),
    UserAchievement.find({ user: req.user._id }).select('achievement unlockedAt'),
    currentMetrics(req.user),
  ]);
  const ownedMap = new Map(owned.map((entry) => [String(entry.achievement), entry.unlockedAt]));

  const catalog = achievements.map((achievement) => {
    const value = metrics[achievement.criteriaType] || 0;
    return {
      ...achievement.toJSON(),
      unlocked: ownedMap.has(String(achievement._id)),
      unlockedAt: ownedMap.get(String(achievement._id)) || null,
      progress: Math.min(100, Math.round((value / achievement.threshold) * 1000) / 10),
      currentValue: value,
    };
  });

  return sendSuccess(res, {
    achievements: catalog,
    unlockedCount: owned.length,
    total: achievements.length,
    metrics,
  });
});

export const myAchievements = asyncHandler(async (req, res) => {
  const [items, all] = await Promise.all([
    UserAchievement.find({ user: req.user._id }).populate('achievement').sort({ unlockedAt: -1 }),
    Achievement.countDocuments({ active: true }),
  ]);
  return sendSuccess(res, { items, totalAvailable: all });
});

export const recheckAchievements = asyncHandler(async (req, res) => {
  const unlocked = await evaluateAchievements(req.user._id);
  return sendSuccess(res, { unlocked: unlocked.map((entry) => entry.achievement) });
});
