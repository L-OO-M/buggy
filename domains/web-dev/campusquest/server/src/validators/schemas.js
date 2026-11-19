import { z } from 'zod';
import { CATEGORIES, DIFFICULTIES } from '../config/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const dateString = z.coerce.date();
const category = z.enum(CATEGORIES);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['student', 'organizer']).default('student'),
  campus: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  campus: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      emailReminders: z.boolean().optional(),
    })
    .optional(),
});

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(4).max(140),
    description: z.string().trim().min(20).max(5000),
    category,
    venue: z.string().trim().min(2).max(200),
    startDate: dateString,
    endDate: dateString,
    capacity: z.coerce.number().int().min(1).max(10000),
    points: z.coerce.number().int().min(0).max(500).optional(),
    club: objectId.nullable().optional(),
    status: z.enum(['draft', 'published']).optional(),
    coverUrl: z.string().trim().max(500).optional(),
    tags: z.array(z.string().max(40)).max(10).optional(),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: 'End date must be after the start date',
    path: ['endDate'],
  });

export const eventUpdateSchema = z
  .object({
    title: z.string().trim().min(4).max(140).optional(),
    description: z.string().trim().min(20).max(5000).optional(),
    category: category.optional(),
    venue: z.string().trim().min(2).max(200).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    capacity: z.coerce.number().int().min(1).max(10000).optional(),
    points: z.coerce.number().int().min(0).max(500).optional(),
    club: objectId.nullable().optional(),
    status: z.enum(['draft', 'published', 'cancelled']).optional(),
    coverUrl: z.string().trim().max(500).optional(),
    tags: z.array(z.string().max(40)).max(10).optional(),
    checkInOpen: z.boolean().optional(),
    checkInOpensAt: dateString.nullable().optional(),
    checkInClosesAt: dateString.nullable().optional(),
  })
  .refine((value) => !value.startDate || !value.endDate || value.endDate > value.startDate, {
    message: 'End date must be after the start date',
    path: ['endDate'],
  });

export const clubCreateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(20).max(2000),
  tagline: z.string().trim().max(160).optional(),
  category: category.optional(),
  logoUrl: z.string().trim().max(500).optional(),
  meetingSchedule: z.string().trim().max(200).optional(),
});

export const clubUpdateSchema = clubCreateSchema.partial();

export const membershipDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});

export const challengeCreateSchema = z
  .object({
    title: z.string().trim().min(4).max(140),
    description: z.string().trim().min(20).max(5000),
    category,
    difficulty: z.enum(DIFFICULTIES),
    type: z.enum(['individual', 'team']).default('individual'),
    startDate: dateString,
    deadline: dateString,
    maxParticipants: z.coerce.number().int().min(1).max(10000).optional(),
    rewardPoints: z.coerce.number().int().min(1).max(2000),
    xpReward: z.coerce.number().int().min(0).max(2000).optional(),
    requirements: z.string().trim().max(2000).optional(),
    evidenceHint: z.string().trim().max(500).optional(),
    club: objectId.nullable().optional(),
    status: z.enum(['draft', 'published']).optional(),
    allowResubmission: z.boolean().optional(),
    badgeCode: z.string().trim().max(60).optional(),
  })
  .refine((value) => value.deadline > value.startDate, {
    message: 'Deadline must be after the start date',
    path: ['deadline'],
  });

export const challengeUpdateSchema = challengeCreateSchema.innerType().partial();

export const submissionCreateSchema = z.object({
  challengeId: objectId,
  note: z.string().trim().min(10).max(2000),
  url: z.union([z.string().trim().url().max(500), z.literal('')]).optional(),
});

export const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  feedback: z.string().trim().max(1000).default(''),
});

export const teamCreateSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(1000).optional(),
  maxSize: z.coerce.number().int().min(2).max(20).optional(),
  club: objectId.nullable().optional(),
});

export const teamInviteSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  userId: objectId.optional(),
  message: z.string().trim().max(300).optional(),
}).refine((value) => value.email || value.userId, { message: 'Provide a student email or id' });

export const invitationResponseSchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
});

export const authIdSchema = z.object({ id: objectId });
export const idParamSchema = z.object({ id: objectId });
export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(120) });

export const reportCreateSchema = z.object({
  targetType: z.enum(['event', 'challenge', 'user', 'submission', 'club']),
  targetId: objectId,
  reason: z.string().trim().min(3).max(200),
  details: z.string().trim().max(2000).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(['student', 'organizer', 'admin']).optional(),
  suspended: z.boolean().optional(),
  suspendedReason: z.string().trim().max(500).optional(),
});

export const manualCheckInSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  userId: objectId.optional(),
}).refine((value) => value.email || value.userId, { message: 'Provide an email or user id' });

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(140),
  message: z.string().trim().min(3).max(500),
  audience: z.enum(['all', 'students', 'club']).default('all'),
  club: objectId.optional(),
});

export const pointAdjustSchema = z.object({
  userId: objectId,
  amount: z.coerce.number().int().min(-10000).max(10000).refine((value) => value !== 0, 'Amount cannot be zero'),
  reason: z.string().trim().min(3).max(300),
});

export const reportResolveSchema = z.object({
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
  resolutionNote: z.string().trim().max(1000).optional(),
});
