# Platform Integration System

This document provides comprehensive information about the platform integration system for eBay, Amazon, and TikTok Shop.

## Overview

The platform integration system allows users to connect their eBay, Amazon, and TikTok Shop stores to automatically sync products, manage inventory, process orders, and handle fulfillment across all platforms from a single interface.

## Architecture

### Core Components

1. **Models** (`src/models/`)
   - `platformIntegrationModel.js` - Stores platform credentials and configuration
   - `platformProductModel.js` - Maps platform products to local products
   - `platformOrderModel.js` - Tracks orders from all platforms

2. **Services** (`src/services/platformServices/`)
   - `eBayService.js` - eBay API interactions
   - `amazonService.js` - Amazon SP-API interactions
   - `tiktokService.js` - TikTok Shop API interactions

3. **Controllers** (`src/controllers/`)
   - `platformConnectionController.js` - Platform authentication and connection management
   - `platformSyncController.js` - Product, inventory, and order synchronization
   - `platformFulfillmentController.js` - Order fulfillment and shipping

4. **Cron Jobs** (`src/cron/`)
   - `platformSyncCron.js` - Automated synchronization tasks

5. **API Routes** (`src/routers/`)
   - `platformRouter.js` - Complete API endpoints for platform integration

## Features

### ✅ Platform Connection
- OAuth2 authentication for all platforms
- Secure credential storage
- Connection health monitoring
- Error handling and recovery

### ✅ Product Synchronization
- Import products from all connected platforms
- Map platform products to local product schema
- Handle product variations and SKUs
- Category and attribute mapping
- Image synchronization

### ✅ Inventory Management
- Real-time inventory synchronization
- Multi-platform inventory updates
- Stock level monitoring
- Low stock alerts

### ✅ Order Processing
- Automatic order import
- Order status tracking
- Customer information mapping
- Order consolidation

### ✅ Fulfillment System
- Multi-platform order fulfillment
- Tracking number management
- Shipping provider integration
- Bulk fulfillment capabilities
- Auto-fulfillment rules

### ✅ Automation
- Scheduled synchronization
- Health check monitoring
- Error recovery
- Performance optimization

## API Endpoints

### Connection Management
```
GET    /api/v1/platforms/connect/{platform}     - Get OAuth URL
GET    /api/v1/platforms/callback/{platform}    - OAuth callback
GET    /api/v1/platforms/connections            - List connections
PUT    /api/v1/platforms/connections/{platform}/settings - Update settings
DELETE /api/v1/platforms/connections/{platform} - Disconnect platform
POST   /api/v1/platforms/connections/{platform}/test - Test connection
```

### Synchronization
```
POST   /api/v1/platforms/sync/products    - Sync products
POST   /api/v1/platforms/sync/inventory   - Sync inventory
POST   /api/v1/platforms/sync/orders      - Sync orders
GET    /api/v1/platforms/sync/status      - Get sync status
POST   /api/v1/platforms/manual-sync      - Manual sync trigger
```

### Order Fulfillment
```
GET    /api/v1/platforms/orders/pending             - Get pending orders
GET    /api/v1/platforms/orders/{orderId}           - Get order details
POST   /api/v1/platforms/orders/{orderId}/fulfill   - Fulfill order
POST   /api/v1/platforms/orders/bulk-fulfill        - Bulk fulfill orders
POST   /api/v1/platforms/orders/auto-fulfill        - Auto-fulfill orders
PUT    /api/v1/platforms/orders/{orderId}/status    - Update order status
GET    /api/v1/platforms/fulfillment/analytics      - Get fulfillment analytics
```

### Webhooks
```
POST   /api/v1/platforms/webhook/ebay     - eBay webhook
POST   /api/v1/platforms/webhook/amazon   - Amazon webhook
POST   /api/v1/platforms/webhook/tiktok   - TikTok webhook
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure the following:

```bash
# eBay Configuration
EBAY_CLIENT_ID=your_ebay_client_id
EBAY_CLIENT_SECRET=your_ebay_client_secret
EBAY_DEV_ID=your_ebay_dev_id
EBAY_REDIRECT_URI=http://localhost:3000/api/v1/platforms/callback/ebay

# Amazon Configuration
AMAZON_CLIENT_ID=your_amazon_client_id
AMAZON_CLIENT_SECRET=your_amazon_client_secret
AMAZON_REFRESH_TOKEN=your_amazon_refresh_token
AMAZON_REDIRECT_URI=http://localhost:3000/api/v1/platforms/callback/amazon
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# TikTok Shop Configuration
TIKTOK_APP_KEY=your_tiktok_app_key
TIKTOK_APP_SECRET=your_tiktok_app_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/platforms/callback/tiktok
```

### 2. Platform Setup

#### eBay Developer Account
1. Create an eBay Developer account
2. Create a new application
3. Get Client ID, Client Secret, and Dev ID
4. Configure redirect URI
5. Set up sandbox environment for testing

#### Amazon SP-API
1. Register as Amazon seller
2. Apply for SP-API access
3. Create IAM user with necessary permissions
4. Get AWS credentials
5. Configure marketplace settings

#### TikTok Shop
1. Create TikTok Shop seller account
2. Apply for API access
3. Create application
4. Get App Key and App Secret
5. Configure webhook endpoints

### 3. Installation

```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

## Usage Examples

### Connecting a Platform

```javascript
// Frontend example
const response = await fetch('/api/v1/platforms/connect/ebay', {
  headers: { Authorization: `Bearer ${token}` }
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

### Syncing Products

```javascript
// Sync all products
const response = await fetch('/api/v1/platforms/sync/products', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Sync specific platform
const response = await fetch('/api/v1/platforms/sync/products', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ platform: 'ebay' })
});
```

### Fulfilling Orders

```javascript
// Fulfill single order
const response = await fetch(`/api/v1/platforms/orders/${orderId}/fulfill`, {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    trackingNumber: '1Z999AA1234567890',
    carrier: 'UPS',
    carrierCode: 'UPS'
  })
});

// Bulk fulfill orders
const response = await fetch('/api/v1/platforms/orders/bulk-fulfill', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orders: [
      { orderId: 'order1', trackingNumber: 'track1', carrier: 'UPS' },
      { orderId: 'order2', trackingNumber: 'track2', carrier: 'FedEx' }
    ]
  })
});
```

## Cron Jobs

The system runs several automated tasks:

- **Product Sync**: Every 6 hours
- **Inventory Sync**: Every 2 hours  
- **Order Sync**: Every hour
- **Order Status Update**: Every 30 minutes
- **Health Check**: Every 15 minutes

### Manual Control

```javascript
// Trigger manual sync
await platformSyncCron.triggerSync('products', userId, 'ebay');

// Get job status
const status = platformSyncCron.getJobStatus();

// Stop specific job
platformSyncCron.stopJob('productSync');
```

## Data Flow

### Product Import Flow
1. User connects platform via OAuth
2. System fetches products from platform API
3. Products are mapped to local schema
4. Local products are created/updated
5. Platform-product mappings are stored
6. Inventory is synchronized

### Order Processing Flow
1. System fetches new orders from platforms
2. Orders are mapped to local schema
3. Platform orders are stored
4. Local orders are optionally created
5. Inventory is reserved
6. Fulfillment workflow begins

### Fulfillment Flow
1. User/system identifies orders to fulfill
2. Shipping labels are generated
3. Tracking information is created
4. Platform APIs are updated
5. Customers are notified
6. Inventory is decremented

## Error Handling

The system includes comprehensive error handling:

- **Token Refresh**: Automatic OAuth token renewal
- **Rate Limiting**: Built-in rate limit handling
- **Retry Logic**: Exponential backoff for failed requests
- **Error Logging**: Detailed error tracking and resolution
- **Health Monitoring**: Continuous connection monitoring

## Security

- **OAuth2**: Secure platform authentication
- **Token Encryption**: Encrypted credential storage
- **Access Control**: User-specific data isolation
- **Webhook Validation**: Signed webhook verification
- **Rate Limiting**: Protection against abuse

## Performance

- **Batch Processing**: Efficient bulk operations
- **Caching**: Strategic data caching
- **Pagination**: Large dataset handling
- **Background Jobs**: Non-blocking operations
- **Database Indexing**: Optimized queries

## Monitoring

- **Sync Status**: Real-time synchronization status
- **Error Tracking**: Comprehensive error monitoring  
- **Performance Metrics**: Sync performance analytics
- **Health Checks**: Platform connection monitoring
- **Analytics**: Detailed fulfillment analytics

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check API credentials
   - Verify redirect URIs
   - Ensure proper scopes

2. **Sync Errors**
   - Review error logs
   - Check token validity
   - Verify data mappings

3. **Fulfillment Issues**
   - Validate tracking numbers
   - Check carrier codes
   - Ensure proper permissions

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development DEBUG=platform:* npm run dev
```

## Support

For technical support:
1. Check error logs in the database
2. Review platform-specific documentation
3. Test connection endpoints
4. Verify webhook configurations

## Future Enhancements

- Additional platform integrations
- Advanced automation rules
- Real-time synchronization
- Enhanced analytics dashboard
- Mobile application support