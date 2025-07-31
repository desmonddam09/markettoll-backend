import express from 'express';
import platformConnectionController from '../controllers/platformConnectionController.js';
import platformSyncController from '../controllers/platformSyncController.js';
import platformFulfillmentController from '../controllers/platformFulfillmentController.js';
import platformSyncCron from '../cron/platformSyncCron.js';
import { validateJWTAndValidateUser } from '../accessControls/index.js';
import { throwError } from '../utils/index.js';

const router = express.Router();

// Connection routes
router.get('/connect/ebay', validateJWTAndValidateUser, platformConnectionController.connectEbay);
router.get('/connect/amazon', validateJWTAndValidateUser, platformConnectionController.connectAmazon);
router.get('/connect/tiktok', validateJWTAndValidateUser, platformConnectionController.connectTikTok);

// Callback routes (these don't need authentication as they come from external platforms)
router.get('/callback/ebay', platformConnectionController.ebayCallback);
router.get('/callback/amazon', platformConnectionController.amazonCallback);
router.get('/callback/tiktok', platformConnectionController.tiktokCallback);

// Connection management
router.get('/connections', validateJWTAndValidateUser, platformConnectionController.getConnections);
router.put('/connections/:platform/settings', validateJWTAndValidateUser, platformConnectionController.updateConnectionSettings);
router.post('/connections/:platform/test', validateJWTAndValidateUser, platformConnectionController.testConnection);
router.delete('/connections/:platform', validateJWTAndValidateUser, platformConnectionController.disconnect);
router.post('/connections/:platform/resolve-errors', validateJWTAndValidateUser, platformConnectionController.resolveSyncErrors);

// Synchronization routes
router.post('/sync/products', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { platform } = req.body;
    
    let result;
    if (platform) {
      result = await platformSyncController.syncProductsForPlatform(userId, platform);
    } else {
      result = await platformSyncController.syncAllProducts(userId);
    }
    
    res.status(200).json({
      success: true,
      message: 'Product sync completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sync/inventory', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { productId } = req.body;
    
    const result = await platformSyncController.syncInventory(userId, productId);
    
    res.status(200).json({
      success: true,
      message: 'Inventory sync completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sync/orders', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { platform, dateFrom } = req.body;
    
    let result;
    if (platform) {
      result = await platformSyncController.syncOrdersForPlatform(userId, platform, dateFrom);
    } else {
      result = await platformSyncController.syncOrders(userId, dateFrom);
    }
    
    res.status(200).json({
      success: true,
      message: 'Order sync completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sync/status', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const status = await platformSyncController.getSyncStatus(userId);
    
    res.status(200).json({
      success: true,
      message: 'Sync status retrieved',
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// Fulfillment routes
router.get('/orders/pending', validateJWTAndValidateUser, platformFulfillmentController.getPendingOrders);
router.get('/orders/:orderId', validateJWTAndValidateUser, platformFulfillmentController.getOrderDetails);
router.post('/orders/:orderId/fulfill', validateJWTAndValidateUser, platformFulfillmentController.fulfillOrder);
router.post('/orders/bulk-fulfill', validateJWTAndValidateUser, platformFulfillmentController.bulkFulfillOrders);
router.post('/orders/auto-fulfill', validateJWTAndValidateUser, platformFulfillmentController.autoFulfillOrders);
router.put('/orders/:orderId/status', validateJWTAndValidateUser, platformFulfillmentController.updateOrderStatus);
router.get('/fulfillment/analytics', validateJWTAndValidateUser, platformFulfillmentController.getFulfillmentAnalytics);

// Manual sync triggers
router.post('/manual-sync', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { syncType, platform } = req.body;
    
    if (!['products', 'inventory', 'orders'].includes(syncType)) {
      return throwError(next, 400, 'Invalid sync type');
    }
    
    const result = await platformSyncCron.triggerSync(syncType, userId, platform);
    
    res.status(200).json({
      success: true,
      message: `Manual ${syncType} sync completed`,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes (require admin access)
router.get('/admin/sync-status', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return throwError(next, 403, 'Admin access required');
    }
    
    const jobStatus = platformSyncCron.getJobStatus();
    
    res.status(200).json({
      success: true,
      message: 'System sync status retrieved',
      data: jobStatus
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/trigger-sync', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return throwError(next, 403, 'Admin access required');
    }
    
    const { syncType } = req.body;
    await platformSyncCron.triggerSync(syncType);
    
    res.status(200).json({
      success: true,
      message: `System-wide ${syncType} sync triggered`,
      data: null
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/stop-job', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return throwError(next, 403, 'Admin access required');
    }
    
    const { jobName } = req.body;
    platformSyncCron.stopJob(jobName);
    
    res.status(200).json({
      success: true,
      message: `Job ${jobName} stopped`,
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// Webhook routes for platform notifications
router.post('/webhook/ebay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Handle eBay webhook notifications
    console.log('eBay webhook received:', req.body);
    
    // Process webhook based on notification type
    // This would handle order status changes, inventory updates, etc.
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('eBay webhook error:', error);
    res.status(500).send('Error');
  }
});

router.post('/webhook/amazon', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Handle Amazon webhook notifications
    console.log('Amazon webhook received:', req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Amazon webhook error:', error);
    res.status(500).send('Error');
  }
});

router.post('/webhook/tiktok', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Handle TikTok webhook notifications
    console.log('TikTok webhook received:', req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('TikTok webhook error:', error);
    res.status(500).send('Error');
  }
});

// Platform-specific routes
router.get('/platforms/ebay/categories', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const eBayService = (await import('../services/platformServices/eBayService.js')).default;
    const categories = await eBayService.getCategoryMapping();
    
    res.status(200).json({
      success: true,
      message: 'eBay categories retrieved',
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

router.get('/platforms/amazon/categories', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const amazonService = (await import('../services/platformServices/amazonService.js')).default;
    const categories = await amazonService.getCategoryMapping();
    
    res.status(200).json({
      success: true,
      message: 'Amazon categories retrieved',
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

router.get('/platforms/tiktok/categories', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const tiktokService = (await import('../services/platformServices/tiktokService.js')).default;
    const categories = await tiktokService.getCategoryMapping(userId);
    
    res.status(200).json({
      success: true,
      message: 'TikTok categories retrieved',
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

router.get('/platforms/tiktok/shipping-providers', validateJWTAndValidateUser, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const tiktokService = (await import('../services/platformServices/tiktokService.js')).default;
    const providers = await tiktokService.getShippingProviders(userId);
    
    res.status(200).json({
      success: true,
      message: 'TikTok shipping providers retrieved',
      data: providers
    });
  } catch (error) {
    next(error);
  }
});

export default router;