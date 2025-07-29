import mongoose from 'mongoose';

const AmazonTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Adjust if your user model is named differently
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  sellingPartnerId: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    enum: ['na', 'eu', 'fe'],
    default: 'na',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AmazonTokenModel = mongoose.model('AmazonTokenModel', AmazonTokenSchema);

export default AmazonTokenModel;