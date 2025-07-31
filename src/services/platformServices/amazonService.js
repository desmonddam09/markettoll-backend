import axios from 'axios';
import crypto from 'crypto';
import SellingPartner from 'selling-partner-api';
import PlatformIntegration from '../../models/platformIntegrationModel.js';
import PlatformProduct from '../../models/platformProductModel.js';
import PlatformOrder from '../../models/platformOrderModel.js';
import { refreshAmazonToken } from '../../utils/refreshAmazonToken.js';

class AmazonService {
  constructor() {
    this.clientId = process.env.AMAZON_CLIENT_ID;
    this.clientSecret = process.env.AMAZON_CLIENT_SECRET;
    this.refreshToken = process.env.AMAZON_REFRESH_TOKEN;
    this.awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    this.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.region = process.env.AMAZON_REGION || 'us-east-1';
    this.marketplace = process.env.AMAZON_MARKETPLACE_ID || 'ATVPDKIKX0DER'; // US marketplace
  }

  // Initialize SP-API client
  async initializeClient(userId) {
    const integration = await PlatformIntegration.findOne({ 
      userId, 
      platform: 'amazon',
      status: 'active'
    });
    
    if (!integration) {
      throw new Error('Amazon integration not found or not active');
    }

    // Check if token needs refresh
    if (Date.now() >= integration.credentials.expiresAt) {
      await this.refreshAccessToken(integration);
    }

    const client = new SellingPartner({
      region: this.region,
      refresh_token: integration.credentials.refreshToken,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: this.clientId,
        SELLING_PARTNER_APP_CLIENT_SECRET: this.clientSecret,
        AWS_ACCESS_KEY_ID: this.awsAccessKey,
        AWS_SECRET_ACCESS_KEY: this.awsSecretKey,
      },
      options: {
        auto_request_tokens: true,
        version_fallback: true,
        use_sandbox: process.env.NODE_ENV !== 'production'
      }
    });

    return client;
  }

  // Refresh Amazon access token
  async refreshAccessToken(integration) {
    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: integration.credentials.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      integration.credentials.accessToken = response.data.access_token;
      integration.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      
      if (response.data.refresh_token) {
        integration.credentials.refreshToken = response.data.refresh_token;
      }

      await integration.save();
      return response.data.access_token;
    } catch (error) {
      integration.status = 'error';
      integration.configuration.syncErrors.push({
        error: `Token refresh failed: ${error.message}`,
        timestamp: new Date()
      });
      await integration.save();
      throw error;
    }
  }

  // Fetch all products from Amazon
  async fetchProducts(userId) {
    const client = await this.initializeClient(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'amazon' });
    
    try {
      // Get catalog items
      const catalogResponse = await client.callAPI({
        operation: 'getCatalogItem',
        endpoint: 'catalogItems',
        path: {
          asin: 'B08N5WRWNW' // This would be dynamic based on seller's items
        },
        query: {
          marketplaceIds: integration.credentials.marketplaceId || this.marketplace,
          includedData: 'attributes,dimensions,identifiers,images,productTypes,salesRanks,summaries'
        }
      });

      // Get seller's inventory
      const inventoryResponse = await client.callAPI({
        operation: 'getInventorySummaries',
        endpoint: 'fbaInventory',
        query: {
          granularityType: 'Marketplace',
          granularityId: integration.credentials.marketplaceId || this.marketplace,
          marketplaceIds: integration.credentials.marketplaceId || this.marketplace
        }
      });

      return this.processAmazonInventory(inventoryResponse);
    } catch (error) {
      console.error('Amazon products fetch error:', error);
      throw error;
    }
  }

  // Process Amazon inventory response
  processAmazonInventory(inventoryResponse) {
    const inventorySummaries = inventoryResponse.inventorySummaries || [];
    
    return inventorySummaries.map(item => ({
      asin: item.asin,
      fnSku: item.fnSku,
      sellerSku: item.sellerSku,
      condition: item.condition,
      totalQuantity: item.totalQuantity,
      inventoryDetails: item.inventoryDetails,
      lastUpdatedTime: item.lastUpdatedTime
    }));
  }

  // Fetch orders from Amazon
  async fetchOrders(userId, dateFrom = null) {
    const client = await this.initializeClient(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'amazon' });
    
    const createdAfter = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const response = await client.callAPI({
        operation: 'getOrders',
        endpoint: 'orders',
        query: {
          MarketplaceIds: integration.credentials.marketplaceId || this.marketplace,
          CreatedAfter: createdAfter,
          OrderStatuses: 'Unshipped,PartiallyShipped'
        }
      });

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        response.Orders.map(async (order) => {
          const itemsResponse = await client.callAPI({
            operation: 'getOrderItems',
            endpoint: 'orders',
            path: {
              orderId: order.AmazonOrderId
            }
          });
          
          return {
            ...order,
            OrderItems: itemsResponse.OrderItems
          };
        })
      );

      return ordersWithItems;
    } catch (error) {
      console.error('Amazon orders fetch error:', error);
      throw error;
    }
  }

  // Update inventory on Amazon
  async updateInventory(userId, sku, quantity) {
    const client = await this.initializeClient(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'amazon' });
    
    try {
      const payload = {
        inventoryDetails: {
          quantity: quantity,
          fulfillableQuantity: quantity
        }
      };

      const response = await client.callAPI({
        operation: 'createOrUpdateInventoryItem',
        endpoint: 'fbaInventory',
        path: {
          sellerSku: sku
        },
        body: payload
      });

      return response;
    } catch (error) {
      console.error('Amazon inventory update error:', error);
      throw error;
    }
  }

  // Confirm shipment for Amazon order
  async confirmShipment(userId, orderId, shipmentData) {
    const client = await this.initializeClient(userId);
    
    try {
      const payload = {
        packageDetail: {
          packageReferenceId: shipmentData.packageReferenceId || `PKG-${Date.now()}`,
          carrierCode: shipmentData.carrierCode || 'OTHER',
          trackingNumber: shipmentData.trackingNumber,
          shipDate: shipmentData.shipDate || new Date().toISOString(),
          orderItems: shipmentData.orderItems.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity
          }))
        }
      };

      const response = await client.callAPI({
        operation: 'confirmShipment',
        endpoint: 'orders',
        path: {
          orderId: orderId
        },
        body: payload
      });

      return response;
    } catch (error) {
      console.error('Amazon shipment confirmation error:', error);
      throw error;
    }
  }

  // Map Amazon product data to local format
  mapProductToLocal(amazonProduct, catalogData = null) {
    return {
      name: catalogData?.summaries?.[0]?.itemName || amazonProduct.sellerSku,
      description: catalogData?.summaries?.[0]?.description || '',
      price: 0, // Need to fetch from pricing API
      quantity: amazonProduct.totalQuantity || 0,
      quantitySold: 0, // Calculate from order history
      images: this.extractAmazonImages(catalogData?.images),
      category: catalogData?.productTypes?.[0]?.displayName || 'Other',
      subCategory: 'Other',
      sku: amazonProduct.sellerSku,
      platformData: {
        asin: amazonProduct.asin,
        fnSku: amazonProduct.fnSku,
        condition: amazonProduct.condition,
        fulfillmentChannel: amazonProduct.inventoryDetails?.fulfillableQuantity > 0 ? 'FBA' : 'FBM',
        lastUpdated: new Date(amazonProduct.lastUpdatedTime),
        syncStatus: 'synced'
      }
    };
  }

  // Extract images from Amazon catalog data
  extractAmazonImages(imagesData) {
    if (!imagesData || !imagesData.length) return [];
    
    const primaryImage = imagesData.find(img => img.variant === 'MAIN') || imagesData[0];
    
    return imagesData.map((image, index) => ({
      url: image.link,
      isDisplay: image.variant === 'MAIN' || index === 0,
      order: index
    }));
  }

  // Map Amazon order data to local format
  mapOrderToLocal(amazonOrder) {
    return {
      platformOrderId: amazonOrder.AmazonOrderId,
      platformData: {
        amazonOrderId: amazonOrder.AmazonOrderId,
        orderStatus: amazonOrder.OrderStatus,
        fulfillmentChannel: amazonOrder.FulfillmentChannel,
        salesChannel: amazonOrder.SalesChannel,
        purchaseDate: new Date(amazonOrder.PurchaseDate),
        lastUpdateDate: new Date(amazonOrder.LastUpdateDate),
        totalAmount: parseFloat(amazonOrder.OrderTotal?.Amount || 0),
        currency: amazonOrder.OrderTotal?.CurrencyCode || 'USD',
        buyerInfo: {
          name: amazonOrder.BuyerInfo?.BuyerName,
          email: amazonOrder.BuyerInfo?.BuyerEmail,
        },
        shippingAddress: {
          name: amazonOrder.ShippingAddress?.Name,
          addressLine1: amazonOrder.ShippingAddress?.AddressLine1,
          addressLine2: amazonOrder.ShippingAddress?.AddressLine2,
          city: amazonOrder.ShippingAddress?.City,
          state: amazonOrder.ShippingAddress?.StateOrRegion,
          postalCode: amazonOrder.ShippingAddress?.PostalCode,
          country: amazonOrder.ShippingAddress?.CountryCode,
        }
      },
      items: amazonOrder.OrderItems?.map(item => ({
        platformProductId: item.ASIN,
        sku: item.SellerSKU,
        title: item.Title,
        quantity: parseInt(item.QuantityOrdered),
        unitPrice: parseFloat(item.ItemPrice?.Amount || 0),
        totalPrice: parseFloat(item.ItemPrice?.Amount || 0) * parseInt(item.QuantityOrdered),
        itemStatus: item.OrderItemId
      })) || [],
      fulfillment: {
        status: this.mapAmazonFulfillmentStatus(amazonOrder.OrderStatus),
        method: amazonOrder.FulfillmentChannel
      }
    };
  }

  // Map Amazon fulfillment status to local status
  mapAmazonFulfillmentStatus(amazonStatus) {
    const statusMap = {
      'Pending': 'pending',
      'Unshipped': 'pending',
      'PartiallyShipped': 'processing',
      'Shipped': 'shipped',
      'Canceled': 'cancelled'
    };
    return statusMap[amazonStatus] || 'pending';
  }

  // Get category mapping for Amazon
  async getCategoryMapping() {
    // Amazon has a complex category system, this is a simplified mapping
    return {
      'Electronics': 'Electronics',
      'Clothing': 'Apparel',
      'Home & Garden': 'Home',
      'Books': 'Books',
      'Toys': 'Toys'
    };
  }

  // Get product pricing
  async getProductPricing(userId, skus) {
    const client = await this.initializeClient(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'amazon' });
    
    try {
      const response = await client.callAPI({
        operation: 'getItemOffersBatch',
        endpoint: 'productPricing',
        body: {
          requests: skus.map(sku => ({
            uri: `/products/pricing/v0/items/${sku}/offers`,
            method: 'GET',
            MarketplaceId: integration.credentials.marketplaceId || this.marketplace,
            ItemCondition: 'New'
          }))
        }
      });

      return response;
    } catch (error) {
      console.error('Amazon pricing fetch error:', error);
      throw error;
    }
  }
}

export default new AmazonService();