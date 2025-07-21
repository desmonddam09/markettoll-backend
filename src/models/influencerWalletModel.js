import mongoose from 'mongoose';

const influencerWalletSchema = new mongoose.Schema({
  influencer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const InfluencerWallet = mongoose.model('InfluencerWallet', influencerWalletSchema);
export default InfluencerWallet



