import mongoose from 'mongoose';
import { CATEGORIES, CHALLENGE_STATUS, CHALLENGE_TYPE, DIFFICULTIES } from '../config/constants.js';

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true, index: true },
    type: { type: String, enum: Object.values(CHALLENGE_TYPE), default: CHALLENGE_TYPE.INDIVIDUAL, index: true },
    startDate: { type: Date, required: true },
    deadline: { type: Date, required: true, index: true },
    maxParticipants: { type: Number, default: 100, min: 1, max: 10000 },
    participationCount: { type: Number, default: 0, min: 0 },
    rewardPoints: { type: Number, required: true, min: 1, max: 2000 },
    xpReward: { type: Number, default: 50, min: 0 },
    requirements: { type: String, default: '', maxlength: 2000 },
    evidenceHint: { type: String, default: '', maxlength: 500 },
    coverUrl: { type: String, default: '' },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null, index: true },
    status: { type: String, enum: Object.values(CHALLENGE_STATUS), default: CHALLENGE_STATUS.DRAFT, index: true },
    badgeCode: { type: String, default: '' },
    allowResubmission: { type: Boolean, default: true },
    moderationNote: { type: String, default: '' },
  },
  { timestamps: true },
);

challengeSchema.index({ status: 1, deadline: 1 });
challengeSchema.index({ status: 1, category: 1, difficulty: 1 });
challengeSchema.index({ title: 'text', description: 'text' });

export const Challenge = mongoose.model('Challenge', challengeSchema);
