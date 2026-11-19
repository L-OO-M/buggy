import crypto from 'node:crypto';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Attendance } from '../models/Attendance.js';
import { ApiError } from '../utils/http.js';
import { awardPoints } from './pointsService.js';
import { createNotification } from './notificationService.js';

function sign(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createCheckInToken(event) {
  const body = Buffer.from(
    JSON.stringify({
      eventId: String(event._id),
      version: event.checkInVersion || 1,
      expiresAt: new Date(new Date(event.endDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
    }),
  ).toString('base64url');
  return `${body}.${sign(event.checkInSecret, body)}`;
}

export function parseCheckInToken(token) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) throw ApiError.badRequest('Malformed check-in token');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw ApiError.badRequest('Malformed check-in token');
  }
  return { body, signature, payload };
}

export async function checkInWithToken({ token, user }) {
  const { body, signature, payload } = parseCheckInToken(token);
  const event = await Event.findById(payload.eventId).select('+checkInSecret');
  if (!event) throw ApiError.notFound('Event not found for this check-in token');

  const expected = sign(event.checkInSecret, body);
  const validSignature = signature.length === expected.length;
  if (!validSignature) throw ApiError.badRequest('This check-in code is not valid');
  if (Number(payload.version) !== Number(event.checkInVersion)) {
    throw ApiError.badRequest('This check-in code has been rotated');
  }
  if (event.status !== 'published') throw ApiError.badRequest('This event is not open for check-in');
  if (!event.checkInOpen) throw ApiError.badRequest('Check-in is currently closed for this event');
  if (new Date(payload.expiresAt).getTime() < Date.now()) {
    throw ApiError.badRequest('This check-in code has expired');
  }
  if (event.checkInOpensAt && Date.now() < new Date(event.checkInOpensAt).getTime()) {
    throw ApiError.badRequest('Check-in has not opened yet');
  }
  if (event.checkInClosesAt && Date.now() > new Date(event.checkInClosesAt).getTime()) {
    throw ApiError.badRequest('Check-in has closed for this event');
  }

  const registration = await EventRegistration.findOne({
    event: event._id,
    user: user._id,
    status: { $in: ['registered', 'checked_in'] },
  });
  if (!registration) throw ApiError.forbidden('Register for this event before checking in');

  const existing = await Attendance.findOne({ event: event._id, user: user._id });
  if (existing) throw ApiError.conflict('You have already checked in to this event');

  const attendance = await Attendance.create({
    event: event._id,
    user: user._id,
    registration: registration._id,
    method: 'qr',
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
  });

  await createNotification({
    user: user._id,
    type: 'registration',
    title: 'Check-in confirmed',
    message: `You earned ${event.points} points at ${event.title}.`,
    link: `/events/${event._id}`,
  });

  return { attendance, event };
}
