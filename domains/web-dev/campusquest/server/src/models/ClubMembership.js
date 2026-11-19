import mongoose from 'mongoose';

const clubMembershipSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['member', 'officer', 'organizer'], default: 'member' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'left'],
      default: 'pending',
      index: true,
    },
    message: { type: String, default: '', maxlength: 300 },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

clubMembershipSchema.index({ club: 1, user: 1 }, { unique: true });
clubMembershipSchema.index({ user: 1, status: 1 });
clubMembershipSchema.index({ club: 1, status: 1 });

export const ClubMembership = mongoose.model('ClubMembership', clubMembershipSchema);
