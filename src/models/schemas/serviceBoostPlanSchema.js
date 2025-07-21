import mongoose from 'mongoose';

const serviceBoostPlanSchema = new mongoose.Schema(
  {
    transactionId: { type: String, default: null },
    name: { type: String, enum: ['No Plan', 'Free Plan', 'Quick Start', 'Extended Exposure', 'Maximum Impact'], default: 'No Plan' },
    purchasedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

export default serviceBoostPlanSchema;
