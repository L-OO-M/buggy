import mongoose from 'mongoose';
import { SUBMISSION_STATUS } from '../config/constants.js';

const submissionSchema = new mongoose.Schema(
  {
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    participation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeParticipation', required: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    attempt: { type: Number, default: 1, min: 1 },
    evidence: {
      note: { type: String, required: true, maxlength: 2000 },
      url: { type: String, default: '' },
    },
    status: { type: String, enum: Object.values(SUBMISSION_STATUS), default: SUBMISSION_STATUS.PENDING, index: true },
    feedback: { type: String, default: '', maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    pointsAwarded: { type: Number, default: 0, min: 0 },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

submissionSchema.index({ challenge: 1, status: 1, createdAt: -1 });
submissionSchema.index({ submittedBy: 1, createdAt: -1 });

export const Submission = mongoose.model('Submission', submissionSchema);
