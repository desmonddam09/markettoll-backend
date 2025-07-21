import mongoose from 'mongoose';

const affiliateReferralSchema = new mongoose.Schema({
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  referralLink: {
    type: String,
    default: ""
  },

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

const AffiliateReferral = mongoose.model('AffiliateReferral', affiliateReferralSchema);
export default AffiliateReferral
