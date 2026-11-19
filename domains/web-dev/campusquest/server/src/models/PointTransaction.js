import mongoose from 'mongoose';

const pointTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['challenge_reward', 'event_checkin', 'event_registration', 'club_join', 'team_create', 'bonus', 'adjustment', 'reversal'],
      required: true,
      index: true,
    },
    reason: { type: String, required: true, maxlength: 300 },
    sourceType: { type: String, default: '', index: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    balanceAfter: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

pointTransactionSchema.index({ user: 1, createdAt: -1 });
pointTransactionSchema.index({ type: 1, createdAt: -1 });

export const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);
