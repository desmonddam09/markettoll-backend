import mongoose from 'mongoose';

const referralRewardSchema = new mongoose.Schema({
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    default: null
  },
  isSubscriptionPaid: {
    type: Boolean,
   default: false
  },
  subscriptionPlan: {
    type: String,
   default: ""
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  referralPercentage: {
    type: Number,
    required: true,
  },
  referralAmount: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true
});

const ReferralReward = mongoose.model('ReferralReward', referralRewardSchema);

export default ReferralReward



