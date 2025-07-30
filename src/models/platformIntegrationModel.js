import mongoose from 'mongoose';

const platformIntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    platform: {
      type: String,
      enum: ['ebay', 'amazon', 'tiktok'],
      required: true,
    },
    credentials: {
      accessToken: { type: String, required: true },
      refreshToken: { type: String, required: true },
      expiresAt: { type: Date, required: true },
      // Platform-specific fields
      sellerId: { type: String, default: null }, // Amazon seller ID
      marketplaceId: { type: String, default: null }, // Amazon marketplace
      storeId: { type: String, default: null }, // TikTok store ID
      clientId: { type: String, default: null },
      clientSecret: { type: String, default: null },
    },
    configuration: {
      autoSync: { type: Boolean, default: true },
      syncInterval: { type: Number, default: 12 }, // hours
      lastSyncAt: { type: Date, default: null },
      syncErrors: [{ 
        error: String, 
        timestamp: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false }
      }],
      // Sync preferences
      syncProducts: { type: Boolean, default: true },
      syncInventory: { type: Boolean, default: true },
      syncOrders: { type: Boolean, default: true },
      autoFulfillment: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'error', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

platformIntegrationSchema.index({ userId: 1, platform: 1 }, { unique: true });
platformIntegrationSchema.index({ platform: 1, status: 1 });

const PlatformIntegration = mongoose.model('PlatformIntegration', platformIntegrationSchema);
export default PlatformIntegration;