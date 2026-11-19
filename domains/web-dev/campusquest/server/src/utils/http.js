export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }

  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function sendSuccess(res, data, status = 200, meta = undefined) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
}

export function parsePagination(query, defaults = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || defaults.limit || 12));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPageMeta(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
