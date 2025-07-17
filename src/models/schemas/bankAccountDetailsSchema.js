import mongoose from 'mongoose';

const bankAccountDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    routingNumber: { type: String, default: '' },
  },
  {
    timestamps: true
  }
);

export default bankAccountDetailsSchema;
