import mongoose from 'mongoose';

const { Schema } = mongoose;

const influencerRateSettingsSchema = new Schema({
  rateStatus: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'manual',
  },
 
}, { timestamps: true });



const InfluencerRateSettings =  mongoose.model('InfluencerRateSettings', influencerRateSettingsSchema);

export default InfluencerRateSettings;

