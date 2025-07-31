import axios from 'axios';
import crypto from 'crypto';
import PlatformIntegration from '../../models/platformIntegrationModel.js';
import PlatformProduct from '../../models/platformProductModel.js';
import PlatformOrder from '../../models/platformOrderModel.js';

class TikTokService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://open-api.tiktokglobalshop.com'
      : 'https://open-api.tiktokglobalshop.com'; // TikTok uses same URL for sandbox
    this.appKey = process.env.TIKTOK_APP_KEY;
    this.appSecret = process.env.TIKTOK_APP_SECRET;
    this.version = '202309';
  }

  // Generate TikTok API signature
  generateSignature(params, appSecret, timestamp) {
    const keys = Object.keys(params).sort();
    let signString = '';
    
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== null) {
        signString += key + params[key];
      }
    }
    
    const finalString = appSecret + signString + appSecret;
    return crypto.createHmac('sha256', appSecret).update(finalString).digest('hex');
  }

  // Get valid access token
  async getValidToken(userId) {
    const integration = await PlatformIntegration.findOne({ 
      userId, 
      platform: 'tiktok',
      status: 'active'
    });
    
    if (!integration) {
      throw new Error('TikTok integration not found or not active');
    }

    // Check if token needs refresh
    if (Date.now() >= integration.credentials.expiresAt) {
      await this.refreshAccessToken(integration);
    }

    return integration.credentials.accessToken;
  }

  // Refresh TikTok access token
  async refreshAccessToken(integration) {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = {
      app_key: this.appKey,
      timestamp: timestamp,
      version: this.version,
      grant_type: 'refresh_token',
      refresh_token: integration.credentials.refreshToken
    };

    const sign = this.generateSignature(params, this.appSecret, timestamp);
    params.sign = sign;

    try {
      const response = await axios.post(`${this.baseUrl}/authorization/${this.version}/token/refresh`, null, {
        params
      });

      if (response.data.code === 0) {
        integration.credentials.accessToken = response.data.data.access_token;
        integration.credentials.expiresAt = new Date(Date.now() + response.data.data.access_token_expire_in * 1000);
        
        if (response.data.data.refresh_token) {
          integration.credentials.refreshToken = response.data.data.refresh_token;
        }

        await integration.save();
        return response.data.data.access_token;
      } else {
        throw new Error(`TikTok token refresh failed: ${response.data.message}`);
      }
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

  // Make authenticated API request
  async makeApiRequest(endpoint, params = {}, accessToken, method = 'GET') {
    const timestamp = Math.floor(Date.now() / 1000);
    const requestParams = {
      app_key: this.appKey,
      timestamp: timestamp,
      version: this.version,
      access_token: accessToken,
      ...params
    };

    const sign = this.generateSignature(requestParams, this.appSecret, timestamp);
    requestParams.sign = sign;

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        params: method === 'GET' ? requestParams : { 
          app_key: this.appKey, 
          timestamp, 
          version: this.version, 
          access_token: accessToken, 
          sign 
        },
        data: method !== 'GET' ? params : undefined
      });

      if (response.data.code === 0) {
        return response.data.data;
      } else {
        throw new Error(`TikTok API error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('TikTok API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Fetch all products from TikTok Shop
  async fetchProducts(userId) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    let allProducts = [];
    let page = 1;
    const pageSize = 50;
    let hasMore = true;

    while (hasMore) {
      const params = {
        shop_id: integration.credentials.storeId,
        page_number: page,
        page_size: pageSize,
        status: 1 // Active products
      };

      const response = await this.makeApiRequest('/product/202309/products/search', params, accessToken);
      
      if (response.products && response.products.length > 0) {
        // Get detailed product information
        const detailedProducts = await this.getProductDetails(userId, response.products.map(p => p.id));
        allProducts.push(...detailedProducts);
        
        hasMore = response.products.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    return allProducts;
  }

  // Get detailed product information
  async getProductDetails(userId, productIds) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    const detailedProducts = [];
    
    // TikTok API allows batch requests, but with limits
    const batchSize = 10;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      for (const productId of batch) {
        try {
          const params = {
            shop_id: integration.credentials.storeId,
            product_id: productId
          };

          const productDetail = await this.makeApiRequest('/product/202309/products/details', params, accessToken);
          detailedProducts.push(productDetail);
        } catch (error) {
          console.error(`Error fetching TikTok product ${productId}:`, error.message);
        }
      }
    }

    return detailedProducts;
  }

  // Fetch orders from TikTok Shop
  async fetchOrders(userId, dateFrom = null) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    const createTimeFrom = dateFrom || Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const createTimeTo = Math.floor(Date.now() / 1000);

    let allOrders = [];
    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const params = {
        shop_id: integration.credentials.storeId,
        order_status: 100, // Awaiting shipment
        create_time_from: createTimeFrom,
        create_time_to: createTimeTo,
        page_size: 50,
        sort_type: 1, // Sort by create time
        cursor: cursor
      };

      const response = await this.makeApiRequest('/order/202309/orders/search', params, accessToken);
      
      if (response.orders && response.orders.length > 0) {
        allOrders.push(...response.orders);
        
        if (response.more && response.next_cursor) {
          cursor = response.next_cursor;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    return allOrders;
  }

  // Update inventory on TikTok Shop
  async updateInventory(userId, skuId, quantity) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    const params = {
      shop_id: integration.credentials.storeId,
      skus: [{
        id: skuId,
        stock_infos: [{
          available_stock: quantity
        }]
      }]
    };

    return await this.makeApiRequest('/product/202309/stocks/update', params, accessToken, 'POST');
  }

  // Update order fulfillment
  async updateOrderFulfillment(userId, orderId, fulfillmentData) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    const params = {
      shop_id: integration.credentials.storeId,
      order_id: orderId,
      tracking_number: fulfillmentData.trackingNumber,
      provider_id: fulfillmentData.providerId || 'OTHER',
      provider_name: fulfillmentData.providerName || 'Other'
    };

    return await this.makeApiRequest('/fulfillment/202309/orders/ship', params, accessToken, 'POST');
  }

  // Map TikTok product data to local format
  mapProductToLocal(tiktokProduct) {
    const mainSku = tiktokProduct.skus?.[0] || {};
    
    return {
      name: tiktokProduct.title || '',
      description: tiktokProduct.description || '',
      price: parseFloat(mainSku.price?.amount || 0),
      quantity: mainSku.stock_infos?.[0]?.available_stock || 0,
      quantitySold: tiktokProduct.sold_count || 0,
      images: this.extractTikTokImages(tiktokProduct.images),
      category: tiktokProduct.category_chains?.[0]?.local_display_name || 'Other',
      subCategory: tiktokProduct.category_chains?.[1]?.local_display_name || 'Other',
      sku: mainSku.seller_sku || null,
      platformData: {
        productId: tiktokProduct.id,
        productStatus: tiktokProduct.status,
        categoryId: tiktokProduct.category_chains?.[0]?.id,
        brandId: tiktokProduct.brand?.id,
        lastUpdated: new Date(),
        syncStatus: 'synced'
      }
    };
  }

  // Extract images from TikTok product data
  extractTikTokImages(imagesData) {
    if (!imagesData || !imagesData.length) return [];
    
    return imagesData.map((image, index) => ({
      url: image.url,
      isDisplay: index === 0,
      order: index
    }));
  }

  // Map TikTok order data to local format
  mapOrderToLocal(tiktokOrder) {
    return {
      platformOrderId: tiktokOrder.id,
      platformData: {
        orderStatus: this.getTikTokOrderStatusText(tiktokOrder.order_status),
        fulfillmentType: tiktokOrder.fulfillment_type,
        purchaseDate: new Date(tiktokOrder.create_time * 1000),
        lastUpdateDate: new Date(tiktokOrder.update_time * 1000),
        totalAmount: parseFloat(tiktokOrder.payment?.total_amount || 0),
        currency: tiktokOrder.payment?.currency || 'USD',
        buyerInfo: {
          name: tiktokOrder.recipient_address?.name,
          email: null, // TikTok doesn't provide email
        },
        shippingAddress: {
          name: tiktokOrder.recipient_address?.name,
          addressLine1: tiktokOrder.recipient_address?.address_line1,
          addressLine2: tiktokOrder.recipient_address?.address_line2,
          city: tiktokOrder.recipient_address?.city,
          state: tiktokOrder.recipient_address?.state,
          postalCode: tiktokOrder.recipient_address?.zipcode,
          country: tiktokOrder.recipient_address?.region_code,
        }
      },
      items: tiktokOrder.order_lines?.map(line => ({
        platformProductId: line.product_id,
        sku: line.seller_sku,
        title: line.product_name,
        quantity: parseInt(line.quantity),
        unitPrice: parseFloat(line.display_price?.amount || 0),
        totalPrice: parseFloat(line.display_price?.amount || 0) * parseInt(line.quantity),
        itemStatus: line.order_line_status
      })) || [],
      fulfillment: {
        status: this.mapTikTokFulfillmentStatus(tiktokOrder.order_status),
        method: tiktokOrder.fulfillment_type
      }
    };
  }

  // Get TikTok order status text
  getTikTokOrderStatusText(statusCode) {
    const statusMap = {
      100: 'AWAITING_SHIPMENT',
      111: 'AWAITING_COLLECTION',
      112: 'IN_TRANSIT',
      114: 'DELIVERED',
      120: 'COMPLETED',
      130: 'CANCELLED'
    };
    return statusMap[statusCode] || 'UNKNOWN';
  }

  // Map TikTok fulfillment status to local status
  mapTikTokFulfillmentStatus(statusCode) {
    const statusMap = {
      100: 'pending',     // AWAITING_SHIPMENT
      111: 'processing',  // AWAITING_COLLECTION
      112: 'shipped',     // IN_TRANSIT
      114: 'delivered',   // DELIVERED
      120: 'delivered',   // COMPLETED
      130: 'cancelled'    // CANCELLED
    };
    return statusMap[statusCode] || 'pending';
  }

  // Get category mapping for TikTok Shop
  async getCategoryMapping(userId) {
    const accessToken = await this.getValidToken(userId);
    
    try {
      const response = await this.makeApiRequest('/product/202309/categories', {}, accessToken);
      
      // Create mapping from local categories to TikTok categories
      const mapping = {};
      if (response.categories) {
        response.categories.forEach(category => {
          mapping[category.local_display_name] = category.id;
        });
      }
      
      return mapping;
    } catch (error) {
      console.error('TikTok category mapping error:', error);
      // Return default mapping
      return {
        'Electronics': '1',
        'Clothing': '2',
        'Home & Garden': '3',
        'Books': '4',
        'Toys': '5'
      };
    }
  }

  // Get shipping providers
  async getShippingProviders(userId) {
    const accessToken = await this.getValidToken(userId);
    const integration = await PlatformIntegration.findOne({ userId, platform: 'tiktok' });
    
    try {
      const params = {
        shop_id: integration.credentials.storeId
      };

      return await this.makeApiRequest('/fulfillment/202309/shipping_providers', params, accessToken);
    } catch (error) {
      console.error('TikTok shipping providers error:', error);
      return [];
    }
  }
}

export default new TikTokService();