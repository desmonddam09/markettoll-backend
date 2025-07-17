import mongoose from 'mongoose';

const influencerReferralSchema = new mongoose.Schema({
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  referralLink: {
    type: String,
    default: ""
  },
  referredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    referredAt: {
      type: Date,
      default: Date.now,
    }
  }],

  // Admin or Influencer control flags
  isActive: {
    type: Boolean,
    default: true, // if false, the code is disabled
  },
  disabledBy: {
    type: String,
    enum: ['admin', 'influencer', null],
    default: null,
  }

}, { timestamps: true });

export default mongoose.model('InfluencerReferral', influencerReferralSchema);
