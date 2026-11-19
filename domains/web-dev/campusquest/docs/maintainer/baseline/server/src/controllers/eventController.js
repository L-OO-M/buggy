import crypto from 'node:crypto';
import { Event } from '../models/Event.js';
import { Club } from '../models/Club.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { ApiError, asyncHandler, buildPageMeta, parsePagination, sendSuccess } from '../utils/http.js';
import { escapeRegex } from '../utils/helpers.js';
import { awardPoints } from '../services/pointsService.js';
import { createNotification, notifyMany } from '../services/notificationService.js';
import { createCheckInToken, checkInWithToken } from '../services/checkinService.js';
import { emitToRoom } from '../sockets/emitter.js';

export async function assertEventManager(event, user) {
  if (user.role === 'admin') return true;
  if (String(event.organizer) === String(user._id)) return true;
  if (event.club) {
    const club = await Club.findById(event.club).select('organizer');
    if (club && String(club.organizer) === String(user._id)) return true;
  }
  throw ApiError.forbidden('Only the event organizer can manage this event');
}

export const listEvents = asyncHandler(async (req, res) => {
  const { q, category, from, to, status, mine } = req.query;
  const pagination = parsePagination(req.query, { limit: 12 });
  const filter = {};

  if (mine === 'true') {
    if (!req.user) throw ApiError.unauthorized();
    filter.organizer = req.user._id;
    if (status) filter.status = status;
  } else {
    filter.status = 'published';
  }
  if (category) filter.category = category;
  if (from || to) {
    filter.startDate = {};
    if (from) filter.startDate.$gte = new Date(from);
    if (to) filter.startDate.$lte = new Date(to);
  }
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { venue: regex }, { tags: regex }];
  }

  const [items, total] = await Promise.all([
    Event.find(filter)
      .populate('organizer', 'name avatarUrl')
      .populate('club', 'name logoUrl category')
      .sort({ startDate: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Event.countDocuments(filter),
  ]);

  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'name avatarUrl role')
    .populate('club', 'name logoUrl category slug organizer');
  if (!event) throw ApiError.notFound('Event not found');
  if (event.status === 'draft' && (!req.user || !['organizer', 'admin'].includes(req.user.role))) {
    throw ApiError.notFound('Event not found');
  }

  let registration = null;
  let attendance = null;
  if (req.user) {
    registration = await EventRegistration.findOne({ event: event._id, user: req.user._id });
    attendance = await Attendance.findOne({ event: event._id, user: req.user._id });
  }
  return sendSuccess(res, { event, registration, attendance });
});

export const createEvent = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (payload.club) {
    const club = await Club.findById(payload.club);
    if (!club || club.status !== 'approved') throw ApiError.badRequest('Select an approved club');
    if (req.user.role !== 'admin' && String(club.organizer) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only host events for clubs you organize');
    }
  }

  const event = await Event.create({
    ...payload,
    organizer: req.user._id,
    checkInSecret: crypto.randomBytes(32).toString('hex'),
    status: payload.status || 'draft',
  });

  await createNotification({
    user: req.user._id,
    type: 'announcement',
    title: `Event ${event.status === 'published' ? 'published' : 'saved as draft'}`,
    message: `${event.title} is ready in your organizer workspace.`,
    link: `/organizer/events/${event._id}/edit`,
  });

  return sendSuccess(res, { event }, 201);
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);

  const wasCancelled = event.status === 'cancelled';
  Object.assign(event, req.body);
  if (event.startDate && event.endDate && new Date(event.endDate) <= new Date(event.startDate)) {
    throw ApiError.badRequest('End date must be after the start date');
  }
  await event.save();

  if (!wasCancelled && event.status === 'cancelled') {
    const registrations = await EventRegistration.find({
      event: event._id,
      status: { $in: ['registered', 'checked_in'] },
    }).select('user');
    await notifyMany(
      registrations.map((registration) => registration.user),
      {
        type: 'announcement',
        title: `Event cancelled: ${event.title}`,
        message: event.cancelledReason || 'The organizer has cancelled this event.',
        link: `/events/${event._id}`,
      },
    );
  }

  return sendSuccess(res, { event });
});

export const cancelEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);
  if (event.status === 'cancelled') throw ApiError.badRequest('Event is already cancelled');

  event.status = 'cancelled';
  event.cancelledReason = req.body.reason || 'Cancelled by organizer';
  await event.save();

  const registrations = await EventRegistration.find({
    event: event._id,
    status: { $in: ['registered', 'checked_in'] },
  }).select('user');
  await notifyMany(
    registrations.map((registration) => registration.user),
    {
      type: 'announcement',
      title: `Event cancelled: ${event.title}`,
      message: event.cancelledReason,
      link: `/events/${event._id}`,
    },
  );
  return sendSuccess(res, { event });
});

export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.status !== 'published') throw ApiError.badRequest('This event is not open for registration');
  if (new Date(event.endDate) < new Date()) throw ApiError.badRequest('This event has already ended');

  const existing = await EventRegistration.findOne({ event: event._id, user: req.user._id });
  if (existing && existing.status !== 'cancelled') throw ApiError.conflict('You are already registered');

  if (existing) {
    const updated = await Event.findOneAndUpdate(
      { _id: event._id, $expr: { $lt: ['$registrationCount', '$capacity'] } },
      { $inc: { registrationCount: 1 } },
      { new: true },
    );
    if (!updated) throw ApiError.conflict('This event is at capacity');
    existing.status = 'registered';
    existing.cancelledAt = null;
    await existing.save();
    await createNotification({
      user: req.user._id,
      type: 'registration',
      title: 'Registration confirmed',
      message: `You are registered for ${event.title}.`,
      link: `/events/${event._id}`,
    });
    return sendSuccess(res, { registration: existing }, 200);
  }

  const claimed = await Event.findOneAndUpdate(
    { _id: event._id, $expr: { $lt: ['$registrationCount', '$capacity'] } },
    { $inc: { registrationCount: 1 } },
    { new: true },
  );
  if (!claimed) throw ApiError.conflict('This event is at capacity');

  let registration;
  try {
    registration = await EventRegistration.create({ event: event._id, user: req.user._id });
  } catch (error) {
    await Event.updateOne({ _id: event._id }, { $inc: { registrationCount: -1 } });
    throw error;
  }

  await awardPoints({
    userId: req.user._id,
    amount: 5,
    type: 'event_registration',
    reason: `Registered for ${event.title}`,
    sourceType: 'event',
    sourceId: event._id,
    idempotencyKey: `event-registration:${event._id}:${req.user._id}`,
  }).catch(() => null);

  await createNotification({
    user: req.user._id,
    type: 'registration',
    title: 'Registration confirmed',
    message: `You are registered for ${event.title} on ${new Date(event.startDate).toGMTString()}.`,
    link: `/events/${event._id}`,
  });

  return sendSuccess(res, { registration }, 201);
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findOne({
    event: req.params.id,
    user: req.user._id,
  }).populate('event');
  if (!registration) throw ApiError.notFound('Registration not found');
  if (registration.status === 'cancelled') throw ApiError.badRequest('Registration is already cancelled');
  if (registration.status === 'checked_in') throw ApiError.badRequest('You cannot cancel after checking in');

  registration.status = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();
  await Event.updateOne({ _id: registration.event._id }, { $inc: { registrationCount: -1 } });

  return sendSuccess(res, { registration });
});

export const listMyRegistrations = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { limit: 12 });
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    EventRegistration.find(filter)
      .populate({
        path: 'event',
        select: 'title coverUrl category startDate endDate venue status points',
      })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    EventRegistration.countDocuments(filter),
  ]);
  return sendSuccess(res, items, 200, buildPageMeta(total, pagination.page, pagination.limit));
});

export const listParticipants = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);

  const registrations = await EventRegistration.find({ event: event._id })
    .populate('user', 'name email avatarUrl department year')
    .sort({ createdAt: 1 });
  const attendance = await Attendance.find({ event: event._id });
  const attendanceByUser = new Map(attendance.map((entry) => [String(entry.user), entry]));

  const participants = registrations.map((registration) => ({
    id: registration._id,
    user: registration.user,
    status: registration.status,
    registeredAt: registration.createdAt,
    checkedInAt: attendanceByUser.get(String(registration.user?._id))?.checkedInAt || null,
  }));

  return sendSuccess(res, { event, participants, attendanceCount: attendance.length });
});

export const generateCheckInCode = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).select('+checkInSecret');
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);

  const token = createCheckInToken(event);
  const host = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5173';
  const checkInUrl = `${host}/checkin?token=${encodeURIComponent(token)}`;
  return sendSuccess(res, {
    token,
    checkInUrl,
    version: event.checkInVersion,
    opensAt: event.checkInOpensAt,
    closesAt: event.checkInClosesAt,
    checkInOpen: event.checkInOpen,
  });
});

export const rotateCheckInCode = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).select('+checkInSecret');
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);
  event.checkInVersion += 1;
  await event.save();
  const token = createCheckInToken(event);
  return sendSuccess(res, { token, version: event.checkInVersion });
});

export const toggleCheckIn = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);
  event.checkInOpen = Boolean(req.body.open);
  await event.save();
  return sendSuccess(res, { event: { id: event._id, checkInOpen: event.checkInOpen } });
});

export const checkIn = asyncHandler(async (req, res) => {
  const result = await checkInWithToken({ token: req.body.token, user: req.user });
  emitToRoom(`event:${result.event._id}`, 'attendance:update', {
    eventId: String(result.event._id),
    userId: String(req.user._id),
  });
  return sendSuccess(res, {
    attendance: result.attendance,
    event: { id: result.event._id, title: result.event.title },
  }, 201);
});

export const manualCheckIn = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  await assertEventManager(event, req.user);

  let user;
  if (req.body.userId) user = await User.findById(req.body.userId);
  else user = await User.findOne({ email: req.body.email });
  if (!user) throw ApiError.notFound('Student not found');

  const registration = await EventRegistration.findOne({ event: event._id, user: user._id });
  if (!registration || registration.status === 'cancelled') {
    throw ApiError.badRequest('Student is not registered for this event');
  }
  const exists = await Attendance.findOne({ event: event._id, user: user._id });
  if (exists) throw ApiError.conflict('Student has already checked in');

  const attendance = await Attendance.create({
    event: event._id,
    user: user._id,
    registration: registration._id,
    method: 'manual',
    markedBy: req.user._id,
  });
  registration.status = 'checked_in';
  registration.checkedInAt = attendance.checkedInAt;
  await registration.save();

  await awardPoints({
    userId: user._id,
    amount: event.points,
    type: 'event_checkin',
    reason: `Checked in to ${event.title}`,
    sourceType: 'event',
    sourceId: event._id,
    idempotencyKey: `checkin:${event._id}:${user._id}`,
    createdBy: req.user._id,
  });

  return sendSuccess(res, { attendance }, 201);
});
