import mongoose from 'mongoose';

const ebayTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
});

const EbayTokenModel = mongoose.model('EbayTokenModel', ebayTokenSchema);
export default EbayTokenModel;