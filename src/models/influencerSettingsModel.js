import mongoose from 'mongoose';

const { Schema } = mongoose;

const influencerSettingsSchema = new Schema({
  influencerStatus: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'manual',
  },
 
}, { timestamps: true });



const InfluencerSettings =  mongoose.model('InfluencerSettings', influencerSettingsSchema);

export default InfluencerSettings;

