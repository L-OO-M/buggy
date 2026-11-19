import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },
    icon: { type: String, default: 'award' },
    category: { type: String, default: 'general' },
    criteriaType: {
      type: String,
      enum: ['points', 'challenges_completed', 'events_attended', 'clubs_joined', 'teams_created', 'streak'],
      required: true,
    },
    threshold: { type: Number, required: true, min: 0 },
    bonusPoints: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Achievement = mongoose.model('Achievement', achievementSchema);
