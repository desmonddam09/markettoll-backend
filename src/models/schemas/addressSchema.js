import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    streetAddress: { type: String, default: '' },
    apartment_suite: { type: String, default: '' },
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export default addressSchema;
