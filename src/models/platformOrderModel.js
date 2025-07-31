import mongoose from 'mongoose';

const platformOrderSchema = new mongoose.Schema(
  {
    localOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'orderProductPurchased',
      default: null, // Can be null for platform-only orders
    },
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
    platformOrderId: {
      type: String,
      required: true,
    },
    platformData: {
      // eBay specific
      transactionId: { type: String, default: null },
      itemId: { type: String, default: null },
      
      // Amazon specific
      amazonOrderId: { type: String, default: null },
      fulfillmentChannel: { type: String, default: null },
      salesChannel: { type: String, default: null },
      
      // TikTok specific
      fulfillmentType: { type: String, default: null },
      
      // Common order data
      orderStatus: { type: String, required: true },
      purchaseDate: { type: Date, required: true },
      lastUpdateDate: { type: Date, default: Date.now },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      
      // Buyer information
      buyerInfo: {
        name: { type: String, default: null },
        email: { type: String, default: null },
        phone: { type: String, default: null },
      },
      
      // Shipping information
      shippingAddress: {
        name: { type: String, default: null },
        addressLine1: { type: String, default: null },
        addressLine2: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        postalCode: { type: String, default: null },
        country: { type: String, default: null },
      },
    },
    items: [{
      platformProductId: { type: String, required: true },
      localProductId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'product',
        default: null 
      },
      sku: { type: String, default: null },
      title: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      itemStatus: { type: String, default: 'pending' },
    }],
    fulfillment: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending',
      },
      method: { type: String, default: null }, // platform fulfillment method
      trackingNumber: { type: String, default: null },
      trackingUrl: { type: String, default: null },
      carrier: { type: String, default: null },
      shippedDate: { type: Date, default: null },
      deliveredDate: { type: Date, default: null },
      fulfillmentErrors: [String],
    },
    sync: {
      lastSyncAt: { type: Date, default: null },
      syncStatus: {
        type: String,
        enum: ['synced', 'pending', 'error'],
        default: 'pending',
      },
      syncErrors: [String],
      needsLocalOrder: { type: Boolean, default: false }, // if we need to create local order
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed', 'error'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

platformOrderSchema.index({ userId: 1, platform: 1 });
platformOrderSchema.index({ platformOrderId: 1, platform: 1 }, { unique: true });
platformOrderSchema.index({ localOrderId: 1 });
platformOrderSchema.index({ platform: 1, 'platformData.orderStatus': 1 });
platformOrderSchema.index({ platform: 1, 'fulfillment.status': 1 });
platformOrderSchema.index({ 'sync.syncStatus': 1 });

const PlatformOrder = mongoose.model('PlatformOrder', platformOrderSchema);
export default PlatformOrder;