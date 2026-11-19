import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { User } from '../models/User.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Attendance } from '../models/Attendance.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Team } from '../models/Team.js';
import { awardPoints } from './pointsService.js';
import { createNotification } from './notificationService.js';

async function metricValue(user, criteriaType) {
  switch (criteriaType) {
    case 'points':
      return user.points;
    case 'challenges_completed': {
      const teams = await Team.find({ members: user._id }).select('_id');
      const teamIds = teams.map((team) => team._id);
      return ChallengeParticipation.countDocuments({
        status: 'approved',
        $or: [{ user: user._id }, ...(teamIds.length ? [{ team: { $in: teamIds } }] : [])],
      });
    }
    case 'events_attended':
      return Attendance.countDocuments({ user: user._id });
    case 'clubs_joined':
      return ClubMembership.countDocuments({ user: user._id, status: 'approved' });
    case 'teams_created':
      return Team.countDocuments({ leader: user._id });
    case 'streak':
      return user.streak || 0;
    default:
      return 0;
  }
}

export async function evaluateAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  const [achievements, owned] = await Promise.all([
    Achievement.find({ active: true }),
    UserAchievement.find({ user: user._id }).select('achievement'),
  ]);
  const ownedIds = new Set(owned.map((entry) => String(entry.achievement)));
  const unlocked = [];

  for (const achievement of achievements) {
    if (ownedIds.has(String(achievement._id))) continue;
    const value = await metricValue(user, achievement.criteriaType);
    if (value <= achievement.threshold) continue;

    try {
      const record = await UserAchievement.create({
        user: user._id,
        achievement: achievement._id,
        context: `${achievement.criteriaType}=${value}`,
      });
      unlocked.push({ achievement, record });
      await createNotification({
        user: user._id,
        type: 'achievement',
        title: `Achievement unlocked: ${achievement.title}`,
        message: achievement.description,
        link: '/achievements',
      });
      if (achievement.bonusPoints > 0) {
        await awardPoints({
          userId: user._id,
          amount: achievement.bonusPoints,
          type: 'bonus',
          reason: `Achievement bonus: ${achievement.title}`,
          sourceType: 'achievement',
          sourceId: achievement._id,
          idempotencyKey: `achievement:${user._id}:${achievement.code}`,
          skipSideEffects: true,
        });
      }
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  return unlocked;
}

export async function reconcileAchievements(userId) {
  const user = await User.findById(userId);
  if (!user) return [];
  const owned = await UserAchievement.find({ user: user._id }).populate('achievement');
  const removed = [];

  for (const entry of owned) {
    if (!entry.achievement) continue;
    const value = await metricValue(user, entry.achievement.criteriaType);
    if (value >= entry.achievement.threshold) continue;

    await UserAchievement.deleteOne({ _id: entry._id });
    removed.push(entry.achievement);
    if (entry.achievement.bonusPoints > 0) {
      await awardPoints({
        userId: user._id,
        amount: -entry.achievement.bonusPoints,
        type: 'reversal',
        reason: `Achievement revoked: ${entry.achievement.title}`,
        sourceType: 'achievement',
        sourceId: entry.achievement._id,
        idempotencyKey: `achievement-revoke:${user._id}:${entry.achievement.code}`,
        skipSideEffects: true,
      });
    }
  }
  return removed;
}
