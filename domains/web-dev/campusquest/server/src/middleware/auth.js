import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { verifyToken } from '../utils/token.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing authentication token');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (user.suspended) throw ApiError.forbidden('This account is suspended');

  req.user = user;
  req.tokenPayload = payload;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && !user.suspended) req.user = user;
  } catch {
    // Public endpoints keep working without a valid session.
  }
  return next();
});

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.tokenPayload?.role ?? req.user.role)) {
      return next(ApiError.forbidden('Your role cannot access this resource'));
    }
    return next();
  };
}

export function requireOrganizer(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (!['organizer', 'admin'].includes(req.tokenPayload?.role ?? req.user.role)) {
    return next(ApiError.forbidden('Organizer access required'));
  }
  return next();
}
