import mongoose from 'mongoose';

const pushNotificationOptionsSchema = new mongoose.Schema(
  {
    chatMessages: { type: Boolean, default: true },
    boostedProductsAndServices: { type: Boolean, default: true },
    wishlistItems: { type: Boolean, default: true },
    customerSupport: { type: Boolean, default: true },
  },
  {
    timestamps: true
  }
);

export default pushNotificationOptionsSchema;
