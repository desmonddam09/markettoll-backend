import mongoose from 'mongoose';

const subscriptionStripeModel = new mongoose.Schema(
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
    subscriptionId: {
      type: String,
      required: true,
      unique: true
    },
    subscriptionName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('subscriptionStripe', subscriptionStripeModel);
