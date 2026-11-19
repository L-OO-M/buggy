import { asyncHandler, sendSuccess } from '../utils/http.js';
import { individualLeaderboard, teamLeaderboard, userRank } from '../services/leaderboardService.js';
import { CATEGORIES } from '../config/constants.js';

export const individual = asyncHandler(async (req, res) => {
  const period = ['global', 'weekly', 'monthly'].includes(req.query.period) ? req.query.period : 'global';
  const result = await individualLeaderboard({
    period,
    page: req.query.page,
    limit: req.query.limit,
    category: req.query.category || '',
  });
  return sendSuccess(res, result.entries, 200, {
    ...result.meta,
    period,
    categories: CATEGORIES,
  });
});

export const teams = asyncHandler(async (req, res) => {
  const result = await teamLeaderboard({ page: req.query.page, limit: req.query.limit });
  return sendSuccess(res, result.entries, 200, result.meta);
});

export const myRank = asyncHandler(async (req, res) => {
  const rank = await userRank(req.user._id);
  return sendSuccess(res, { rank });
});
