import mongoose from 'mongoose';

const teamInvitationSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending', index: true },
    message: { type: String, default: '', maxlength: 300 },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

teamInvitationSchema.index(
  { team: 1, invitee: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);

export const TeamInvitation = mongoose.model('TeamInvitation', teamInvitationSchema);
