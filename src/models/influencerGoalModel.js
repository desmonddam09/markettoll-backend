import mongoose from 'mongoose';

const { Schema } = mongoose;

const influencerGoalsSchema = new Schema({

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

const InfluencerGoal = mongoose.model('InfluencerGoal', influencerGoalsSchema);

export default InfluencerGoal;
