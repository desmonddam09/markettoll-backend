import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ['none', 'apple', 'google', 'stripe'], default: 'none' },
    transactionId: { type: String, default: null },
    name: { type: String, enum: ['No Plan', 'Free Plan', 'Basic Plan', 'Standard Plan', 'Premium Plan'], default: 'No Plan' },
    availablePostings: { type: Number, default: 1 },
    availableBoosts: { type: Number, default: 1 },
    wishlistFeature: { type: Boolean, default: false },
    purchasedAt: { type: Date, default: null },
    renewedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
  },
  {
    timestamps: true
  }
);

export default subscriptionPlanSchema;
