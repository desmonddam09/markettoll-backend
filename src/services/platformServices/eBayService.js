import axios from 'axios';
import xml2js from 'xml2js';
import PlatformIntegration from '../../models/platformIntegrationModel.js';
import PlatformProduct from '../../models/platformProductModel.js';
import PlatformOrder from '../../models/platformOrderModel.js';
import { refreshEbayToken } from '../../utils/refreshEbayToken.js';

class EBayService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.ebay.com' 
      : 'https://api.sandbox.ebay.com';
    this.tradingApiUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.ebay.com/ws/api/.dll'
      : 'https://api.sandbox.ebay.com/ws/api/.dll';
    this.clientId = process.env.EBAY_CLIENT_ID;
    this.clientSecret = process.env.EBAY_CLIENT_SECRET;
    this.devId = process.env.EBAY_DEV_ID;
  }

  // Get valid access token (refresh if needed)
  async getValidToken(userId) {
    const integration = await PlatformIntegration.findOne({ 
      userId, 
      platform: 'ebay',
      status: 'active'
    });
    
    if (!integration) {
      throw new Error('eBay integration not found or not active');
    }

    // Check if token needs refresh
    if (Date.now() >= integration.credentials.expiresAt) {
      try {
        const newTokens = await refreshEbayToken(integration.credentials.refreshToken);
        
        integration.credentials.accessToken = newTokens.access_token;
        integration.credentials.expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        if (newTokens.refresh_token) {
          integration.credentials.refreshToken = newTokens.refresh_token;
        }
        
        await integration.save();
        return newTokens.access_token;
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

    return integration.credentials.accessToken;
  }

  // Fetch all products from eBay
  async fetchProducts(userId) {
    const accessToken = await this.getValidToken(userId);
    console.log("accessToken", accessToken);
    const products = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const pageProducts = await this.fetchProductsPage(accessToken, page);
      products.push(...pageProducts);
      hasMore = pageProducts.length === 100;
      page++;
    }

    return products;
  }

  // Fetch products for a specific page
  async fetchProductsPage(accessToken, pageNumber = 1) {
    const xmlBody = `
      <?xml version="1.0" encoding="utf-8"?>
      <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
          <eBayAuthToken>${accessToken}</eBayAuthToken>
        </RequesterCredentials>
        <ActiveList>
          <Include>true</Include>
          <Pagination>
            <EntriesPerPage>100</EntriesPerPage>
            <PageNumber>${pageNumber}</PageNumber>
          </Pagination>
        </ActiveList>
        <OutputSelector>ItemArray.Item</OutputSelector>
      </GetMyeBaySellingRequest>
    `;

    const headers = {
      'Content-Type': 'text/xml',
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': this.devId,
      'X-EBAY-API-APP-NAME': this.clientId,
      'X-EBAY-API-CERT-NAME': this.clientSecret,
      'X-EBAY-API-SITEID': '0',
      'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
    };

    try {
      const response = await axios.post(this.tradingApiUrl, xmlBody, { headers });
      const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
      
      const items = result?.GetMyeBaySellingResponse?.ActiveList?.ItemArray?.Item || [];
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      console.error('eBay API error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Fetch orders from eBay
  async fetchOrders(userId, dateFrom = null) {
    const accessToken = await this.getValidToken(userId);
    
    const params = {
      limit: 50,
    };
    
    if (dateFrom) {
      params.filter = `creationdate:[${dateFrom}..],orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}`;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/sell/fulfillment/v1/order`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params
      });

      return response.data.orders || [];
    } catch (error) {
      console.error('eBay orders fetch error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update inventory quantity on eBay
  async updateInventory(userId, itemId, quantity) {
    const accessToken = await this.getValidToken(userId);
    
    const xmlBody = `
      <?xml version="1.0" encoding="utf-8"?>
      <ReviseInventoryStatusRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
          <eBayAuthToken>${accessToken}</eBayAuthToken>
        </RequesterCredentials>
        <InventoryStatus>
          <ItemID>${itemId}</ItemID>
          <Quantity>${quantity}</Quantity>
        </InventoryStatus>
      </ReviseInventoryStatusRequest>
    `;

    const headers = {
      'Content-Type': 'text/xml',
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': this.devId,
      'X-EBAY-API-APP-NAME': this.clientId,
      'X-EBAY-API-CERT-NAME': this.clientSecret,
      'X-EBAY-API-SITEID': '0',
      'X-EBAY-API-CALL-NAME': 'ReviseInventoryStatus',
    };

    try {
      const response = await axios.post(this.tradingApiUrl, xmlBody, { headers });
      const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
      return result.ReviseInventoryStatusResponse;
    } catch (error) {
      console.error('eBay inventory update error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Update order fulfillment
  async updateOrderFulfillment(userId, orderId, fulfillmentData) {
    const accessToken = await this.getValidToken(userId);
    
    const payload = {
      shippingFulfillments: [{
        lineItems: fulfillmentData.lineItems.map(item => ({
          lineItemId: item.lineItemId,
          quantity: item.quantity
        })),
        shippedDate: fulfillmentData.shippedDate || new Date().toISOString(),
        shippingCarrierCode: fulfillmentData.carrier || 'OTHER',
        trackingNumber: fulfillmentData.trackingNumber
      }]
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('eBay fulfillment update error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Map eBay product data to local product format
  mapProductToLocal(ebayProduct) {
    return {
      name: ebayProduct.Title || '',
      description: ebayProduct.Description || '',
      price: parseFloat(ebayProduct.SellingStatus?.CurrentPrice?._ || ebayProduct.StartPrice?._ || 0),
      quantity: parseInt(ebayProduct.Quantity || 0),
      quantitySold: parseInt(ebayProduct.SellingStatus?.QuantitySold || 0),
      images: this.extractImages(ebayProduct.PictureDetails),
      category: ebayProduct.PrimaryCategory?.CategoryName || 'Other',
      subCategory: ebayProduct.SecondaryCategory?.CategoryName || 'Other',
      sku: ebayProduct.SKU || null,
      platformData: {
        itemId: ebayProduct.ItemID,
        listingType: ebayProduct.ListingType,
        listingStatus: ebayProduct.SellingStatus?.ListingStatus,
        categoryId: ebayProduct.PrimaryCategory?.CategoryID,
        condition: ebayProduct.ConditionDisplayName,
        location: ebayProduct.Location,
        country: ebayProduct.Country,
        site: ebayProduct.Site,
        lastUpdated: new Date(),
        syncStatus: 'synced'
      }
    };
  }

  // Extract images from eBay picture details
  extractImages(pictureDetails) {
    if (!pictureDetails) return [];
    
    const urls = pictureDetails.PictureURL;
    if (!urls) return [];
    
    const imageUrls = Array.isArray(urls) ? urls : [urls];
    return imageUrls.map((url, index) => ({
      url: url,
      isDisplay: index === 0,
      order: index
    }));
  }

  // Map eBay order data to local order format
  mapOrderToLocal(ebayOrder) {
    return {
      platformOrderId: ebayOrder.orderId,
      platformData: {
        orderStatus: ebayOrder.orderFulfillmentStatus,
        purchaseDate: new Date(ebayOrder.creationDate),
        lastUpdateDate: new Date(ebayOrder.lastModifiedDate),
        totalAmount: parseFloat(ebayOrder.pricingSummary?.total?.value || 0),
        currency: ebayOrder.pricingSummary?.total?.currency || 'USD',
        buyerInfo: {
          name: ebayOrder.buyer?.username,
          email: null, // eBay doesn't provide email in API
        },
        shippingAddress: {
          name: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.fullName,
          addressLine1: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine1,
          addressLine2: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.addressLine2,
          city: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.city,
          state: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.stateOrProvince,
          postalCode: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.postalCode,
          country: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo?.contactAddress?.countryCode,
        }
      },
      items: ebayOrder.lineItems?.map(item => ({
        platformProductId: item.legacyItemId,
        sku: item.sku,
        title: item.title,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.lineItemCost?.value || 0),
        totalPrice: parseFloat(item.total?.value || 0),
        itemStatus: item.lineItemFulfillmentStatus
      })) || [],
      fulfillment: {
        status: this.mapEbayFulfillmentStatus(ebayOrder.orderFulfillmentStatus),
        method: ebayOrder.fulfillmentStartInstructions?.[0]?.shippingStep?.shippingServiceCode
      }
    };
  }

  // Map eBay fulfillment status to local status
  mapEbayFulfillmentStatus(ebayStatus) {
    const statusMap = {
      'NOT_STARTED': 'pending',
      'IN_PROGRESS': 'processing',
      'FULFILLED': 'shipped'
    };
    return statusMap[ebayStatus] || 'pending';
  }

  // Get category mapping for eBay
  async getCategoryMapping() {
    // This would typically fetch eBay categories and map them to local categories
    // For now, return a basic mapping
    return {
      'Electronics': '11450',
      'Clothing': '11450',
      'Home & Garden': '11700',
      'Books': '267',
      'Toys': '220'
    };
  }
}

export default new EBayService();