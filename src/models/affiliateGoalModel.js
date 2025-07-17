import mongoose from 'mongoose';

const { Schema } = mongoose;

const affiliateGoalsSchema = new Schema({

  totalReferrals: {
    type: Number,
    required: true,
    default: 0
  },
  influencerRate: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

const AffiliateGoal = mongoose.model('AffiliateGoal', affiliateGoalsSchema);

export default AffiliateGoal;
