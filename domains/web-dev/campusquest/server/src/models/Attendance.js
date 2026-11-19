import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'EventRegistration', default: null },
    checkedInAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['qr', 'manual'], default: 'qr' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

attendanceSchema.index({ event: 1, user: 1 }, { unique: true });
attendanceSchema.index({ user: 1, checkedInAt: -1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
