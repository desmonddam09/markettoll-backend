import mongoose from 'mongoose';

const stripeCustomerSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    paymentMethod: {
      id: { type: String, default: null },
      brand: { type: String, default: '' },
      exp_month: { type: String, default: '' },
      exp_year: { type: String, default: '' },
      last4: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export default stripeCustomerSchema;
