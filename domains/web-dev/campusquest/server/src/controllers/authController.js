import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { ApiError, asyncHandler, sendSuccess } from '../utils/http.js';

function startOfDay(date) {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, campus, department, year } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = password;
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    campus: campus || 'Main Campus',
    department: department || '',
    year: year || 1,
  });

  const token = signToken(user);
  return sendSuccess(res, { token, user: user.toJSON() }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Incorrect email or password');
  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Incorrect email or password');
  if (user.suspended) throw ApiError.forbidden('This account is suspended');

  const today = startOfDay(new Date());
  const last = user.lastActiveDate ? startOfDay(user.lastActiveDate) : null;
  if (!last) {
    user.streak = 1;
  } else {
    const diffDays = Math.round((today - last) / 86400000);
    if (diffDays === 1) user.streak += 1;
    else if (diffDays > 1) user.streak = 1;
  }
  user.longestStreak = Math.max(user.longestStreak || 0, user.streak);
  user.lastActiveDate = new Date();
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  return sendSuccess(res, { token, user: user.toJSON() });
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user.toJSON() });
});

export const logout = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { message: 'Signed out' });
});
