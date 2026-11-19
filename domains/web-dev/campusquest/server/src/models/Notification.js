import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'team_invitation',
        'challenge_deadline',
        'submission_status',
        'achievement',
        'event_reminder',
        'registration',
        'announcement',
        'club',
        'system',
      ],
      default: 'system',
      index: true,
    },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, required: true, maxlength: 500 },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
