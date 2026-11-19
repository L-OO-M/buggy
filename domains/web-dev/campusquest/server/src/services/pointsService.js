import { PointTransaction } from '../models/PointTransaction.js';
import { User } from '../models/User.js';
import { levelForXp } from '../config/constants.js';

export async function awardPoints({
  userId,
  amount,
  type,
  reason,
  sourceType = '',
  sourceId = null,
  idempotencyKey,
  createdBy = null,
  skipSideEffects = false,
}) {
  if (!Number.isFinite(amount) || amount === 0) {
    throw Object.assign(new Error('Point amount must be a non-zero number'), { status: 400 });
  }
  if (!idempotencyKey) {
    throw Object.assign(new Error('Point transactions require an idempotency key'), { status: 400 });
  }

  const transaction = await PointTransaction.create({
    user: userId,
    amount,
    type,
    reason,
    sourceType,
    sourceId,
    idempotencyKey,
    createdBy,
  });

  const user = await User.findByIdAndUpdate(
    userId,
    [
      {
        $set: {
          points: { $max: [0, { $add: ['$points', amount] }] },
          xp: { $max: [0, { $add: ['$xp', amount] }] },
        },
      },
    ],
    { new: true },
  );

  if (!user) {
    await PointTransaction.deleteOne({ _id: transaction._id });
    throw Object.assign(new Error('User not found for point award'), { status: 404 });
  }

  const level = levelForXp(user.xp);
  if (user.level !== level.level || user.levelTitle !== level.title) {
    user.level = level.level;
    user.levelTitle = level.title;
    await User.updateOne({ _id: user._id }, { level: level.level, levelTitle: level.title });
  }

  transaction.balanceAfter = user.points;
  await transaction.save();

  if (skipSideEffects) {
    const { evaluateAchievements } = await import('./achievementService.js');
    await evaluateAchievements(String(userId));
    const { broadcastLeaderboardSnapshot } = await import('./leaderboardService.js');
    await broadcastLeaderboardSnapshot();
  }

  return { transaction, user, duplicate: false };
}

export async function reversePoints({ userId, amount, type = 'reversal', reason, sourceType = '', sourceId = null, idempotencyKey, createdBy = null }) {
  return awardPoints({
    userId,
    amount: -Math.abs(amount),
    type,
    reason,
    sourceType,
    sourceId,
    idempotencyKey,
    createdBy,
    skipSideEffects: true,
  });
}
