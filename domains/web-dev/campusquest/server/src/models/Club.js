import mongoose from 'mongoose';
import { CATEGORIES } from '../config/constants.js';
import { slugify } from '../utils/helpers.js';

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, maxlength: 300 },
    kind: { type: String, default: 'update' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, maxlength: 2000 },
    tagline: { type: String, default: '', maxlength: 160 },
    category: { type: String, enum: CATEGORIES, default: 'academic', index: true },
    logoUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'archived'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    membersCount: { type: Number, default: 0, min: 0 },
    foundedAt: { type: Date, default: Date.now },
    meetingSchedule: { type: String, default: '' },
    activity: { type: [activitySchema], default: [] },
  },
  { timestamps: true },
);

clubSchema.index({ status: 1, category: 1, membersCount: -1 });

clubSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.name) this.slug = `${slugify(this.name)}-${Math.random().toString(36).slice(2, 6)}`;
  next();
});

export const Club = mongoose.model('Club', clubSchema);
