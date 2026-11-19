import mongoose from 'mongoose';

const challengeParticipationSchema = new mongoose.Schema(
  {
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    participantKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['active', 'submitted', 'approved', 'rejected', 'withdrawn'],
      default: 'active',
      index: true,
    },
    lastSubmissionAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    pointsAwarded: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

challengeParticipationSchema.index({ challenge: 1, status: 1 });
challengeParticipationSchema.index({ user: 1, status: 1 });

export const ChallengeParticipation = mongoose.model('ChallengeParticipation', challengeParticipationSchema);
