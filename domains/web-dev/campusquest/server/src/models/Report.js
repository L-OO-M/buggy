import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['event', 'challenge', 'user', 'submission', 'club'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, maxlength: 200 },
    details: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open', index: true },
    resolutionNote: { type: String, default: '', maxlength: 1000 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
