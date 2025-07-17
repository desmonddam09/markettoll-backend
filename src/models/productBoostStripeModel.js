import mongoose from 'mongoose';

const productBoostStripeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true
    },
    boostName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('productBoostStripe', productBoostStripeSchema);
