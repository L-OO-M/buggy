import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, levelForXp } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.STUDENT, index: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    campus: { type: String, default: 'Main Campus', maxlength: 120 },
    department: { type: String, default: '', maxlength: 120 },
    year: { type: Number, min: 1, max: 6, default: 1 },
    points: { type: Number, default: 0, min: 0, index: true },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1 },
    levelTitle: { type: String, default: 'Explorer' },
    streak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },
    suspended: { type: Boolean, default: false, index: true },
    suspendedReason: { type: String, default: '' },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailReminders: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ points: -1, _id: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.pre('save', function syncLevel(next) {
  if (this.isModified('xp') || this.isNew) {
    const info = levelForXp(this.xp);
    this.level = info.level;
    this.levelTitle = info.title;
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

export const User = mongoose.model('User', userSchema);
