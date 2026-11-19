import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 1000 },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    membersCount: { type: Number, default: 1, min: 1 },
    maxSize: { type: Number, default: 5, min: 2, max: 20 },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null, index: true },
    points: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    activity: {
      type: [
        {
          actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          message: { type: String, maxlength: 300 },
          createdAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

teamSchema.index({ leader: 1, name: 1 }, { unique: true });
teamSchema.index({ status: 1, points: -1 });

export const Team = mongoose.model('Team', teamSchema);
