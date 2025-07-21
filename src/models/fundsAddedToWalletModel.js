import mongoose from 'mongoose';

const fundsAddedToWalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true
    },
  },
  {
    timestamps: true
  }
);

export default mongoose.model('fundsAddedToWallet', fundsAddedToWalletSchema);
