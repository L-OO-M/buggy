export const ROLES = Object.freeze({
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
});

export const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
});

export const REGISTRATION_STATUS = Object.freeze({
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
  CHECKED_IN: 'checked_in',
});

export const CHALLENGE_TYPE = Object.freeze({
  INDIVIDUAL: 'individual',
  TEAM: 'team',
});

export const CHALLENGE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

export const SUBMISSION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard', 'elite']);

export const CATEGORIES = Object.freeze([
  'technology',
  'sports',
  'arts',
  'academic',
  'service',
  'wellness',
  'entrepreneurship',
  'culture',
]);

export const LEVELS = [
  { level: 1, title: 'Explorer', minXp: 0 },
  { level: 2, title: 'Scout', minXp: 100 },
  { level: 3, title: 'Pathfinder', minXp: 300 },
  { level: 4, title: 'Trailblazer', minXp: 650 },
  { level: 5, title: 'Champion', minXp: 1100 },
  { level: 6, title: 'Legend', minXp: 1800 },
];

export function levelForXp(xp = 0) {
  let current = LEVELS[0];
  for (const entry of LEVELS) {
    if (xp >= entry.minXp) current = entry;
  }
  return current;
}

export const POINT_RULES = Object.freeze({
  EVENT_CHECKIN: 20,
  EVENT_REGISTRATION: 5,
  CHALLENGE_APPROVED_BASE: 10,
  CLUB_JOIN: 5,
  TEAM_CREATE: 10,
});
