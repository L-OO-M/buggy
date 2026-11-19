import mongoose from 'mongoose';
import { REGISTRATION_STATUS } from '../config/constants.js';

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
      index: true,
    },
    checkedInAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    note: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);

eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
eventRegistrationSchema.index({ user: 1, status: 1, createdAt: -1 });
eventRegistrationSchema.index({ event: 1, status: 1 });

export const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);
