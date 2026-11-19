import { User } from '../models/User.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Team } from '../models/Team.js';
import { Submission } from '../models/Submission.js';
import { broadcastLeaderboard } from '../sockets/emitter.js';
import { buildPageMeta, parsePagination } from '../utils/http.js';

export function attachRanks(rows) {
  let previousScore = null;
  let currentRank = 0;
  return rows.map((row, index) => {
    if (previousScore === null || row.score !== previousScore) {
      currentRank = index + 1;
      previousScore = row.score;
    }
    return { ...row, rank: currentRank };
  });
}

function periodStart(period) {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getUTCDay();
    const diff = (day + 6) % 7;
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  }
  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  return null;
}

async function scoreRows(period) {
  const start = periodStart(period);
  if (!start) {
    const users = await User.find({ suspended: false })
      .select('name avatarUrl points level levelTitle campus')
      .sort({ points: -1, _id: 1 })
      .lean();
    return users.map((user) => ({
      id: String(user._id),
      name: user.name,
      avatarUrl: user.avatarUrl,
      points: user.points,
      score: user.points,
      level: user.level,
      levelTitle: user.levelTitle,
      campus: user.campus,
    }));
  }

  const grouped = await PointTransaction.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: '$user', score: { $sum: '$amount' } } },
    { $match: { score: { $gt: 0 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.suspended': false } },
    {
      $project: {
        _id: 0,
        id: { $toString: '$user._id' },
        name: '$user.name',
        avatarUrl: '$user.avatarUrl',
        points: '$user.points',
        level: '$user.level',
        levelTitle: '$user.levelTitle',
        campus: '$user.campus',
        score: 1,
      },
    },
    { $sort: { score: -1, name: 1 } },
  ]);
  return grouped;
}

export async function individualLeaderboard({ period = 'global', page = 1, limit = 20, category = '' } = {}) {
  let rows;
  if (category) {
    const grouped = await Submission.aggregate([
      { $match: { status: 'approved' } },
      { $lookup: { from: 'challenges', localField: 'challenge', foreignField: '_id', as: 'challengeDoc' } },
      { $unwind: '$challengeDoc' },
      { $match: { 'challengeDoc.category': category } },
      { $group: { _id: '$submittedBy', score: { $sum: '$pointsAwarded' } } },
      { $match: { score: { $gt: 0 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.suspended': false } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$user._id' },
          name: '$user.name',
          avatarUrl: '$user.avatarUrl',
          points: '$user.points',
          level: '$user.level',
          levelTitle: '$user.levelTitle',
          campus: '$user.campus',
          score: 1,
        },
      },
      { $sort: { score: -1, name: 1 } },
    ]);
    rows = grouped;
  } else {
    rows = await scoreRows(period);
  }

  const ranked = attachRanks(rows);
  const pagination = parsePagination({ page, limit });
  const slice = ranked.slice(pagination.skip, pagination.skip + pagination.limit);
  return { entries: slice, meta: buildPageMeta(ranked.length, pagination.page, pagination.limit) };
}

export async function teamLeaderboard({ page = 1, limit = 20 } = {}) {
  const teams = await Team.find({ status: 'active' })
    .populate('members', 'name points avatarUrl suspended')
    .lean();

  const rows = teams
    .map((team) => {
      const activeMembers = (team.members || []).filter((member) => !member.suspended);
      const score = activeMembers.reduce((sum, member) => sum + (member.points || 0), 0);
      return {
        id: String(team._id),
        name: team.name,
        description: team.description,
        membersCount: activeMembers.length,
        maxSize: team.maxSize,
        score,
        members: activeMembers.slice(0, 6).map((member) => ({
          id: String(member._id),
          name: member.name,
          avatarUrl: member.avatarUrl,
          points: member.points,
        })),
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const ranked = attachRanks(rows);
  const pagination = parsePagination({ page, limit });
  return {
    entries: ranked.slice(pagination.skip, pagination.skip + pagination.limit),
    meta: buildPageMeta(ranked.length, pagination.page, pagination.limit),
  };
}

export async function globalTop(limit = 10) {
  const { entries } = await individualLeaderboard({ period: 'global', page: 1, limit });
  return entries;
}

export async function userRank(userId) {
  const { entries } = await individualLeaderboard({ period: 'global', page: 1, limit: 1 });
  void entries;
  const all = await scoreRows('global');
  const ranked = attachRanks(all);
  return ranked.find((row) => row.id === String(userId)) || null;
}

export async function broadcastLeaderboardSnapshot() {
  try {
    const [individual, teams] = await Promise.all([
      individualLeaderboard({ period: 'global', page: 1, limit: 10 }),
      teamLeaderboard({ page: 1, limit: 10 }),
    ]);
    broadcastLeaderboard({
      individual: individual.entries,
      teams: teams.entries,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    // Sockets are optional during tests and scripts.
  }
}
