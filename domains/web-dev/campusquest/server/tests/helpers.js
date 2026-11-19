import { User } from '../src/models/User.js';
import { Club } from '../src/models/Club.js';
import { Event } from '../src/models/Event.js';
import { Challenge } from '../src/models/Challenge.js';
import { signToken } from '../src/utils/token.js';

export const PASSWORD = 'CampusQuest123!';
let sequence = 0;

export function uniqueEmail(prefix = 'user') {
  sequence += 1;
  return `${prefix}${sequence}@campusquest.test`;
}

export async function createUser({ role = 'student', points = 0, xp = points, ...overrides } = {}) {
  return User.create({
    name: `Test ${role} ${sequence}`,
    email: uniqueEmail(role),
    passwordHash: PASSWORD,
    role,
    campus: 'Main Campus',
    points,
    xp,
    ...overrides,
  });
}

export function auth(user) {
  return { Authorization: `Bearer ${signToken(user)}` };
}

export async function createClub(organizer, overrides = {}) {
  return Club.create({
    name: `Club ${sequence}`,
    slug: `club-${sequence}-${Math.random().toString(36).slice(2, 6)}`,
    description: 'A student club with a detailed description.',
    category: 'academic',
    organizer: organizer._id,
    status: 'approved',
    membersCount: 1,
    ...overrides,
  });
}

export function futureDate(days = 7) {
  return new Date(Date.now() + days * 86400000);
}

export function pastDate(days = 1) {
  return new Date(Date.now() - days * 86400000);
}

export async function createEvent(organizer, overrides = {}) {
  return Event.create({
    title: 'Test Campus Event',
    description: 'A detailed campus event description for integration tests.',
    category: 'academic',
    venue: 'Main Hall',
    startDate: pastDate(1),
    endDate: futureDate(1),
    capacity: 10,
    organizer: organizer._id,
    status: 'published',
    points: 20,
    checkInSecret: 'test-check-in-secret',
    ...overrides,
  });
}

export async function createChallenge(organizer, overrides = {}) {
  return Challenge.create({
    title: 'Test Campus Challenge',
    description: 'A detailed campus challenge description for integration tests.',
    category: 'academic',
    difficulty: 'easy',
    type: 'individual',
    startDate: pastDate(1),
    deadline: futureDate(7),
    rewardPoints: 20,
    organizer: organizer._id,
    status: 'published',
    ...overrides,
  });
}
