import { Report } from '../models/Report.js';
import { asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { ApiError } from '../utils/http.js';

export const createReport = asyncHandler(async (req, res) => {
  const existing = await Report.findOne({
    reporter: req.user._id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    status: { $in: ['open', 'reviewing'] },
  });
  if (existing) throw ApiError.conflict('You already have an open report for this item');

  const report = await Report.create({ ...req.body, reporter: req.user._id });
  return sendSuccess(res, { report }, 201);
});

export const myReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, reports);
});

export const listReports = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter', 'name email role')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Report.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');
  report.status = req.body.status;
  report.resolutionNote = req.body.resolutionNote || '';
  if (['resolved', 'dismissed'].includes(req.body.status)) {
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
  }
  await report.save();
  return sendSuccess(res, { report });
});
