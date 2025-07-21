import mongoose from 'mongoose';

const serviceBoostStripeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'service',
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

export default mongoose.model('serviceBoostStripe', serviceBoostStripeSchema);
