import { Notification } from '../models/Notification.js';
import { Club } from '../models/Club.js';
import { User } from '../models/User.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { createNotification, notifyMany } from '../services/notificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 20 });
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  if (req.query.type) filter.type = req.query.type;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  return sendSuccess(res, items, 200, { ...buildPageMeta(total, pagination.page, pagination.limit), unread });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  return sendSuccess(res, { unread: count });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true, readAt: new Date() },
  );
  return sendSuccess(res, { updated: result.modifiedCount });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { message: 'Notification removed' });
});

export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audience, club } = req.body;
  let users;
  if (audience === 'club') {
    if (!club) throw ApiError.badRequest('Choose a club for this announcement');
    const clubDoc = await Club.findById(club);
    if (!clubDoc) throw ApiError.notFound('Club not found');
    if (req.user.role !== 'admin' && String(clubDoc.organizer) !== String(req.user._id)) {
      throw ApiError.forbidden('You do not manage this club');
    }
    users = await User.find({}).select('_id');
    const { ClubMembership } = await import('../models/ClubMembership.js');
    const memberships = await ClubMembership.find({ club: clubDoc._id, status: 'approved' }).select('user');
    users = memberships.map((entry) => entry.user);
  } else if (audience === 'students') {
    users = (await User.find({ role: 'student', suspended: false }).select('_id')).map((user) => user._id);
  } else {
    users = (await User.find({ suspended: false }).select('_id')).map((user) => user._id);
  }

  await notifyMany(users, {
    type: 'announcement',
    title,
    message,
    link: '/notifications',
    meta: { from: req.user.name, role: req.user.role },
  });

  return sendSuccess(res, { sent: users.length }, 201);
});

export const adminBroadcast = asyncHandler(async (req, res) => {
  const users = await User.find({ suspended: false }).select('_id');
  await Promise.all(
    users.map((user) =>
      createNotification({
        user: user._id,
        type: 'system',
        title: req.body.title,
        message: req.body.message,
        link: '/notifications',
      }),
    ),
  );
  return sendSuccess(res, { sent: users.length }, 201);
});
