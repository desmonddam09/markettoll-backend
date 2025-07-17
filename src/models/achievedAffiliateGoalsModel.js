import mongoose from 'mongoose';

const { Schema } = mongoose;

const achievedAffiliateGoalsSchema = new Schema(
  {
    affiliate: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    currentInfluencerRate: {
      type: Number,
      required: true,
      default: 0,
    },
    additionalRate: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const AchievedAffiliateGoal = mongoose.model('AchievedAffiliateGoal', achievedAffiliateGoalsSchema);

export default AchievedAffiliateGoal;
