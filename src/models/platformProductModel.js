import mongoose from 'mongoose';

const platformProductSchema = new mongoose.Schema(
  {
    localProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
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
    platformProductId: {
      type: String,
      required: true, // eBay Item ID, Amazon ASIN, TikTok Product ID
    },
    platformSku: {
      type: String,
      default: null,
    },
    platformData: {
      // eBay specific
      itemId: { type: String, default: null },
      listingType: { type: String, default: null },
      listingStatus: { type: String, default: null },
      
      // Amazon specific
      asin: { type: String, default: null },
      fnSku: { type: String, default: null },
      marketplaceId: { type: String, default: null },
      fulfillmentChannel: { type: String, default: null },
      
      // TikTok specific
      productStatus: { type: String, default: null },
      categoryId: { type: String, default: null },
      brandId: { type: String, default: null },
      
      // Common fields
      lastUpdated: { type: Date, default: Date.now },
      syncStatus: { 
        type: String, 
        enum: ['synced', 'pending', 'error'], 
        default: 'pending' 
      },
      syncErrors: [String],
    },
    inventory: {
      platformQuantity: { type: Number, default: 0 },
      localQuantity: { type: Number, default: 0 },
      lastInventorySync: { type: Date, default: null },
      inventoryDelta: { type: Number, default: 0 }, // difference to sync
    },
    pricing: {
      platformPrice: { type: Number, default: 0 },
      localPrice: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      lastPriceSync: { type: Date, default: null },
    },
    mapping: {
      titleMapping: { type: String, default: null },
      descriptionMapping: { type: String, default: null },
      categoryMapping: { type: String, default: null },
      imageMapping: [String], // URLs of platform images
      attributeMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    syncSettings: {
      autoSync: { type: Boolean, default: true },
      syncInventory: { type: Boolean, default: true },
      syncPrice: { type: Boolean, default: true },
      syncImages: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted', 'error'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

platformProductSchema.index({ localProductId: 1, platform: 1 }, { unique: true });
platformProductSchema.index({ userId: 1, platform: 1 });
platformProductSchema.index({ platformProductId: 1, platform: 1 });
platformProductSchema.index({ platform: 1, 'platformData.syncStatus': 1 });

const PlatformProduct = mongoose.model('PlatformProduct', platformProductSchema);
export default PlatformProduct;