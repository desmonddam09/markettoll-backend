import mongoose from 'mongoose';

const productAndSubscriptionRevenueSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    platform: {
      type: String,
      enum: ['apple', 'google', 'stripe'],
      required: true
    },
    transactionId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      enum: ['Basic Plan', 'Standard Plan', 'Premium Plan', 'Quick Start', 'Extended Exposure', 'Maximum Impact'],
      required: true
    },
    purchasedAt: {
      type: Date,
      required: true,
    },
    renewedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    price: {
      type: Number,
      required: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    type: {
      type: String,
      enum: ['subscription', 'product'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

productAndSubscriptionRevenueSchema.statics.addPurchase = async function (user, platform, transactionId, name, purchasedAt, renewedAt, expiresAt, price, cancelledAt, type) {
  const purchase = new this({
    user,
    platform,
    transactionId,
    name,
    purchasedAt,
    renewedAt,
    expiresAt,
    price,
    cancelledAt,
    type,
  });

  await purchase.save();

  return purchase;
};

productAndSubscriptionRevenueSchema.statics.cancelPurchase = async function (transactionId) {
  const date = new Date();
  const purchase = await this.findOne({ transactionId })
    .sort({ createdAt: -1 });

  if (purchase) {
    purchase.cancelledAt = date;
    await purchase.save();
  }

  return purchase;
};

export default mongoose.model('productAndSubscriptionRevenue', productAndSubscriptionRevenueSchema);
