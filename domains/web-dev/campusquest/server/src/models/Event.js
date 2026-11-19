import mongoose from 'mongoose';
import { CATEGORIES, EVENT_STATUS } from '../config/constants.js';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    coverUrl: { type: String, default: '' },
    venue: { type: String, required: true, maxlength: 200 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1, max: 10000 },
    registrationCount: { type: Number, default: 0, min: 0 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null, index: true },
    status: { type: String, enum: Object.values(EVENT_STATUS), default: EVENT_STATUS.DRAFT, index: true },
    points: { type: Number, default: 20, min: 0 },
    tags: { type: [String], default: [] },
    checkInSecret: { type: String, required: true, select: false },
    checkInOpen: { type: Boolean, default: true },
    checkInVersion: { type: Number, default: 1 },
    checkInOpensAt: { type: Date, default: null },
    checkInClosesAt: { type: Date, default: null },
    moderationNote: { type: String, default: '' },
    cancelledReason: { type: String, default: '' },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ title: 'text', description: 'text', venue: 'text' });
eventSchema.index({ category: 1, startDate: 1, status: 1 });

export const Event = mongoose.model('Event', eventSchema);
