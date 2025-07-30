import eBayService from '../services/platformServices/eBayService.js';
import amazonService from '../services/platformServices/amazonService.js';
import tiktokService from '../services/platformServices/tiktokService.js';
import PlatformIntegration from '../models/platformIntegrationModel.js';
import PlatformProduct from '../models/platformProductModel.js';
import PlatformOrder from '../models/platformOrderModel.js';
import { productModel, orderProductPurchasedModel } from '../models/index.js';
import { throwError, sendNotification } from '../utils/index.js';

class PlatformSyncController {
  // Get platform service instance
  getService(platform) {
    const services = {
      'ebay': eBayService,
      'amazon': amazonService,
      'tiktok': tiktokService
    };
    return services[platform];
  }

  // Sync all products for a user from all connected platforms
  async syncAllProducts(userId) {
    const integrations = await PlatformIntegration.find({ 
      userId, 
      status: 'active',
      'configuration.syncProducts': true 
    });

    const results = [];
    for (const integration of integrations) {
      try {
        const result = await this.syncProductsForPlatform(userId, integration.platform);
        results.push({ platform: integration.platform, ...result });
      } catch (error) {
        console.error(`Error syncing products for ${integration.platform}:`, error);
        results.push({ 
          platform: integration.platform, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Sync products for a specific platform
  async syncProductsForPlatform(userId, platform) {
    const service = this.getService(platform);
    if (!service) {
      throw new Error(`Service not found for platform: ${platform}`);
    }

    try {
      // Update sync start time
      await PlatformIntegration.updateOne(
        { userId, platform },
        { 'configuration.lastSyncAt': new Date() }
      );

      // Fetch products from platform
      const platformProducts = await service.fetchProducts(userId);
      
      let imported = 0;
      let updated = 0;
      let errors = 0;

      for (const platformProduct of platformProducts) {
        try {
          const result = await this.processProduct(userId, platform, platformProduct, service);
          if (result.isNew) imported++;
          else updated++;
        } catch (error) {
          console.error(`Error processing product:`, error);
          errors++;
        }
      }

      // Update integration status
      await PlatformIntegration.updateOne(
        { userId, platform },
        { 
          status: 'active',
          $push: {
            'configuration.syncErrors': {
              $each: [],
              $slice: -10 // Keep only last 10 errors
            }
          }
        }
      );

      return { 
        success: true, 
        imported, 
        updated, 
        errors,
        total: platformProducts.length 
      };

    } catch (error) {
      // Update integration with error
      await PlatformIntegration.updateOne(
        { userId, platform },
        { 
          status: 'error',
          $push: {
            'configuration.syncErrors': {
              error: error.message,
              timestamp: new Date()
            }
          }
        }
      );
      throw error;
    }
  }

  // Process individual product
  async processProduct(userId, platform, platformProduct, service) {
    const platformProductId = this.getPlatformProductId(platform, platformProduct);
    
    // Check if product already exists
    let existingPlatformProduct = await PlatformProduct.findOne({
      userId,
      platform,
      platformProductId
    });

    const mappedProduct = service.mapProductToLocal(platformProduct);
    
    if (existingPlatformProduct) {
      // Update existing product
      await this.updateExistingProduct(existingPlatformProduct, mappedProduct, platformProduct);
      return { isNew: false, product: existingPlatformProduct };
    } else {
      // Create new product
      const newProduct = await this.createNewProduct(userId, platform, mappedProduct, platformProduct);
      return { isNew: true, product: newProduct };
    }
  }

  // Get platform-specific product ID
  getPlatformProductId(platform, product) {
    switch (platform) {
      case 'ebay':
        return product.ItemID;
      case 'amazon':
        return product.asin || product.sellerSku;
      case 'tiktok':
        return product.id;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  // Update existing product
  async updateExistingProduct(existingPlatformProduct, mappedProduct, platformProduct) {
    // Update local product if it exists
    if (existingPlatformProduct.localProductId) {
      await productModel.findByIdAndUpdate(
        existingPlatformProduct.localProductId,
        {
          quantity: mappedProduct.quantity,
          price: mappedProduct.price,
          name: mappedProduct.name,
          description: mappedProduct.description,
          images: mappedProduct.images
        }
      );
    }

    // Update platform product mapping
    await PlatformProduct.findByIdAndUpdate(
      existingPlatformProduct._id,
      {
        'platformData': mappedProduct.platformData,
        'inventory.platformQuantity': mappedProduct.quantity,
        'pricing.platformPrice': mappedProduct.price,
        'platformData.lastUpdated': new Date(),
        'platformData.syncStatus': 'synced'
      }
    );
  }

  // Create new product
  async createNewProduct(userId, platform, mappedProduct, platformProduct) {
    // Create local product first
    const localProduct = await productModel.create({
      seller: userId,
      name: mappedProduct.name,
      description: mappedProduct.description,
      price: mappedProduct.price,
      quantity: mappedProduct.quantity,
      category: mappedProduct.category,
      subCategory: mappedProduct.subCategory,
      images: mappedProduct.images,
      country: 'US', // Default values - should be configured
      state: 'CA',
      city: 'Los Angeles',
      fulfillmentMethod: {
        delivery: true,
        selfPickup: false
      },
      sku: mappedProduct.sku,
      // Add platform-specific IDs for tracking
      eBayId: platform === 'ebay' ? this.getPlatformProductId(platform, platformProduct) : null
    });

    // Create platform product mapping
    const platformProduct = await PlatformProduct.create({
      localProductId: localProduct._id,
      userId,
      platform,
      platformProductId: this.getPlatformProductId(platform, platformProduct),
      platformSku: mappedProduct.sku,
      platformData: mappedProduct.platformData,
      inventory: {
        platformQuantity: mappedProduct.quantity,
        localQuantity: mappedProduct.quantity,
        lastInventorySync: new Date()
      },
      pricing: {
        platformPrice: mappedProduct.price,
        localPrice: mappedProduct.price,
        lastPriceSync: new Date()
      },
      mapping: {
        titleMapping: mappedProduct.name,
        descriptionMapping: mappedProduct.description,
        categoryMapping: mappedProduct.category,
        imageMapping: mappedProduct.images?.map(img => img.url) || []
      }
    });

    return platformProduct;
  }

  // Sync inventory across platforms
  async syncInventory(userId, productId = null) {
    let query = { userId };
    if (productId) {
      query.localProductId = productId;
    }

    const platformProducts = await PlatformProduct.find(query)
      .populate('localProductId');

    const results = [];

    for (const platformProduct of platformProducts) {
      try {
        const service = this.getService(platformProduct.platform);
        
        // Check if local quantity differs from platform quantity
        const localQuantity = platformProduct.localProductId?.quantity || 0;
        const platformQuantity = platformProduct.inventory.platformQuantity;

        if (localQuantity !== platformQuantity) {
          // Update platform inventory
          await service.updateInventory(
            userId, 
            platformProduct.platformProductId, 
            localQuantity
          );

          // Update platform product record
          await PlatformProduct.findByIdAndUpdate(
            platformProduct._id,
            {
              'inventory.platformQuantity': localQuantity,
              'inventory.lastInventorySync': new Date(),
              'inventory.inventoryDelta': 0
            }
          );

          results.push({
            platform: platformProduct.platform,
            productId: platformProduct.platformProductId,
            oldQuantity: platformQuantity,
            newQuantity: localQuantity,
            success: true
          });
        }
      } catch (error) {
        console.error(`Inventory sync error for ${platformProduct.platform}:`, error);
        results.push({
          platform: platformProduct.platform,
          productId: platformProduct.platformProductId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Sync orders from all platforms
  async syncOrders(userId, dateFrom = null) {
    const integrations = await PlatformIntegration.find({ 
      userId, 
      status: 'active',
      'configuration.syncOrders': true 
    });

    const results = [];

    for (const integration of integrations) {
      try {
        const result = await this.syncOrdersForPlatform(userId, integration.platform, dateFrom);
        results.push({ platform: integration.platform, ...result });
      } catch (error) {
        console.error(`Error syncing orders for ${integration.platform}:`, error);
        results.push({ 
          platform: integration.platform, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Sync orders for a specific platform
  async syncOrdersForPlatform(userId, platform, dateFrom = null) {
    const service = this.getService(platform);
    if (!service) {
      throw new Error(`Service not found for platform: ${platform}`);
    }

    try {
      const platformOrders = await service.fetchOrders(userId, dateFrom);
      
      let imported = 0;
      let updated = 0;
      let errors = 0;

      for (const platformOrder of platformOrders) {
        try {
          const result = await this.processOrder(userId, platform, platformOrder, service);
          if (result.isNew) imported++;
          else updated++;
        } catch (error) {
          console.error(`Error processing order:`, error);
          errors++;
        }
      }

      return { 
        success: true, 
        imported, 
        updated, 
        errors,
        total: platformOrders.length 
      };

    } catch (error) {
      throw error;
    }
  }

  // Process individual order
  async processOrder(userId, platform, platformOrder, service) {
    const platformOrderId = service.mapOrderToLocal(platformOrder).platformOrderId;
    
    // Check if order already exists
    let existingPlatformOrder = await PlatformOrder.findOne({
      userId,
      platform,
      platformOrderId
    });

    const mappedOrder = service.mapOrderToLocal(platformOrder);
    
    if (existingPlatformOrder) {
      // Update existing order
      await this.updateExistingOrder(existingPlatformOrder, mappedOrder);
      return { isNew: false, order: existingPlatformOrder };
    } else {
      // Create new order
      const newOrder = await this.createNewOrder(userId, platform, mappedOrder);
      return { isNew: true, order: newOrder };
    }
  }

  // Update existing order
  async updateExistingOrder(existingPlatformOrder, mappedOrder) {
    await PlatformOrder.findByIdAndUpdate(
      existingPlatformOrder._id,
      {
        platformData: mappedOrder.platformData,
        fulfillment: mappedOrder.fulfillment,
        'sync.lastSyncAt': new Date(),
        'sync.syncStatus': 'synced'
      }
    );
  }

  // Create new order
  async createNewOrder(userId, platform, mappedOrder) {
    // Map platform product IDs to local product IDs
    const itemsWithLocalProducts = await Promise.all(
      mappedOrder.items.map(async (item) => {
        const platformProduct = await PlatformProduct.findOne({
          userId,
          platform,
          platformProductId: item.platformProductId
        });

        return {
          ...item,
          localProductId: platformProduct?.localProductId || null
        };
      })
    );

    const platformOrder = await PlatformOrder.create({
      userId,
      platform,
      platformOrderId: mappedOrder.platformOrderId,
      platformData: mappedOrder.platformData,
      items: itemsWithLocalProducts,
      fulfillment: mappedOrder.fulfillment,
      sync: {
        lastSyncAt: new Date(),
        syncStatus: 'synced',
        needsLocalOrder: true // Flag to create local order if needed
      }
    });

    // Optionally create local order if auto-fulfillment is enabled
    const integration = await PlatformIntegration.findOne({ userId, platform });
    if (integration?.configuration?.autoFulfillment) {
      await this.createLocalOrder(platformOrder);
    }

    return platformOrder;
  }

  // Create local order from platform order
  async createLocalOrder(platformOrder) {
    try {
      // This would create a local order in your system
      // Implementation depends on your local order structure
      const localOrderData = {
        placer: platformOrder.userId,
        paymentMethod: 'platform_payment',
        platformFee: 0, // Calculate based on platform
        products: platformOrder.items
          .filter(item => item.localProductId)
          .map(item => ({
            product: item.localProductId,
            quantity: item.quantity,
            fulfillmentMethod: {
              delivery: true,
              selfPickup: false
            }
          })),
        deliveryAddress: {
          name: platformOrder.platformData.shippingAddress?.name,
          address: platformOrder.platformData.shippingAddress?.addressLine1,
          city: platformOrder.platformData.shippingAddress?.city,
          state: platformOrder.platformData.shippingAddress?.state,
          zipCode: platformOrder.platformData.shippingAddress?.postalCode,
          country: platformOrder.platformData.shippingAddress?.country
        }
      };

      const localOrder = await orderProductPurchasedModel.create(localOrderData);
      
      // Link platform order to local order
      await PlatformOrder.findByIdAndUpdate(
        platformOrder._id,
        { 
          localOrderId: localOrder._id,
          'sync.needsLocalOrder': false 
        }
      );

      return localOrder;
    } catch (error) {
      console.error('Error creating local order:', error);
      throw error;
    }
  }

  // Update order fulfillment status
  async updateOrderFulfillment(userId, platformOrderId, platform, fulfillmentData) {
    const service = this.getService(platform);
    if (!service) {
      throw new Error(`Service not found for platform: ${platform}`);
    }

    try {
      // Update fulfillment on platform
      await service.updateOrderFulfillment(userId, platformOrderId, fulfillmentData);

      // Update local platform order record
      await PlatformOrder.findOneAndUpdate(
        { userId, platform, platformOrderId },
        {
          'fulfillment.status': 'shipped',
          'fulfillment.trackingNumber': fulfillmentData.trackingNumber,
          'fulfillment.carrier': fulfillmentData.carrier,
          'fulfillment.shippedDate': new Date(),
          'sync.lastSyncAt': new Date()
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Fulfillment update error:', error);
      throw error;
    }
  }

  // Get sync status for user
  async getSyncStatus(userId) {
    const integrations = await PlatformIntegration.find({ userId });
    const productCounts = await PlatformProduct.aggregate([
      { $match: { userId } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);
    const orderCounts = await PlatformOrder.aggregate([
      { $match: { userId } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    const status = integrations.map(integration => ({
      platform: integration.platform,
      status: integration.status,
      lastSync: integration.configuration.lastSyncAt,
      autoSync: integration.configuration.autoSync,
      products: productCounts.find(p => p._id === integration.platform)?.count || 0,
      orders: orderCounts.find(o => o._id === integration.platform)?.count || 0,
      errors: integration.configuration.syncErrors.filter(e => !e.resolved).length
    }));

    return status;
  }
}

export default new PlatformSyncController();