import mongoose from 'mongoose';

const stripeConnectedAccountSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    external_account: {
      id: { type: String, default: null },
      bankName: { type: String, default: '' },
      last4: { type: String, default: '' },
      routingNumber: { type: String, default: '' }
    }
  },
  {
    timestamps: true,
    _id: false,
  }
);

export default stripeConnectedAccountSchema;
