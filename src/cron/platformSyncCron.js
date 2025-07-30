import cron from 'node-cron';
import PlatformIntegration from '../models/platformIntegrationModel.js';
import platformSyncController from '../controllers/platformSyncController.js';
import PlatformOrder from '../models/platformOrderModel.js';
import { sendNotification } from '../utils/index.js';

class PlatformSyncCron {
  constructor() {
    this.jobs = new Map();
  }

  // Start all cron jobs
  startAllJobs() {
    this.startProductSync();
    this.startInventorySync();
    this.startOrderSync();
    this.startOrderStatusUpdate();
    this.startHealthCheck();
    console.log('✅ All platform sync cron jobs started');
  }

  // Product synchronization - runs every 6 hours
  startProductSync() {
    const job = cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Starting scheduled product sync...');
      await this.runProductSync();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('productSync', job);
  }

  // Inventory synchronization - runs every 2 hours
  startInventorySync() {
    const job = cron.schedule('0 */2 * * *', async () => {
      console.log('📦 Starting scheduled inventory sync...');
      await this.runInventorySync();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('inventorySync', job);
  }

  // Order synchronization - runs every hour
  startOrderSync() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('📋 Starting scheduled order sync...');
      await this.runOrderSync();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('orderSync', job);
  }

  // Order status update - runs every 30 minutes
  startOrderStatusUpdate() {
    const job = cron.schedule('*/30 * * * *', async () => {
      console.log('🚚 Starting scheduled order status update...');
      await this.runOrderStatusUpdate();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('orderStatusUpdate', job);
  }

  // Health check and error resolution - runs every 15 minutes
  startHealthCheck() {
    const job = cron.schedule('*/15 * * * *', async () => {
      console.log('🏥 Running platform health check...');
      await this.runHealthCheck();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.jobs.set('healthCheck', job);
  }

  // Execute product sync for all active integrations
  async runProductSync() {
    try {
      const integrations = await PlatformIntegration.find({ 
        status: 'active',
        'configuration.autoSync': true,
        'configuration.syncProducts': true
      });

      let totalProcessed = 0;
      let totalErrors = 0;

      for (const integration of integrations) {
        try {
          const lastSync = integration.configuration.lastSyncAt;
          const syncInterval = integration.configuration.syncInterval || 12;
          const shouldSync = !lastSync || 
            (Date.now() - new Date(lastSync).getTime()) > (syncInterval * 60 * 60 * 1000);

          if (shouldSync) {
            console.log(`Syncing products for user ${integration.userId} on ${integration.platform}`);
            
            const result = await platformSyncController.syncProductsForPlatform(
              integration.userId, 
              integration.platform
            );

            totalProcessed += result.total || 0;
            totalErrors += result.errors || 0;

            console.log(`✅ ${integration.platform} sync completed: ${result.imported} imported, ${result.updated} updated`);
          }
        } catch (error) {
          console.error(`❌ Product sync failed for user ${integration.userId} on ${integration.platform}:`, error.message);
          
          // Update integration with error
          await PlatformIntegration.updateOne(
            { _id: integration._id },
            {
              $push: {
                'configuration.syncErrors': {
                  error: `Product sync failed: ${error.message}`,
                  timestamp: new Date()
                }
              }
            }
          );
          totalErrors++;
        }
      }

      console.log(`📊 Product sync summary: ${totalProcessed} products processed, ${totalErrors} errors`);
    } catch (error) {
      console.error('❌ Product sync cron job failed:', error);
    }
  }

  // Execute inventory sync for all active integrations
  async runInventorySync() {
    try {
      const integrations = await PlatformIntegration.find({ 
        status: 'active',
        'configuration.autoSync': true,
        'configuration.syncInventory': true
      });

      let totalUpdated = 0;
      let totalErrors = 0;

      for (const integration of integrations) {
        try {
          console.log(`Syncing inventory for user ${integration.userId} on ${integration.platform}`);
          
          const results = await platformSyncController.syncInventory(integration.userId);
          const successfulUpdates = results.filter(r => r.success).length;
          const failedUpdates = results.filter(r => !r.success).length;

          totalUpdated += successfulUpdates;
          totalErrors += failedUpdates;

          console.log(`✅ ${integration.platform} inventory sync: ${successfulUpdates} updated, ${failedUpdates} errors`);
        } catch (error) {
          console.error(`❌ Inventory sync failed for user ${integration.userId} on ${integration.platform}:`, error.message);
          totalErrors++;
        }
      }

      console.log(`📦 Inventory sync summary: ${totalUpdated} items updated, ${totalErrors} errors`);
    } catch (error) {
      console.error('❌ Inventory sync cron job failed:', error);
    }
  }

  // Execute order sync for all active integrations
  async runOrderSync() {
    try {
      const integrations = await PlatformIntegration.find({ 
        status: 'active',
        'configuration.autoSync': true,
        'configuration.syncOrders': true
      });

      let totalProcessed = 0;
      let totalErrors = 0;

      for (const integration of integrations) {
        try {
          const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
          
          console.log(`Syncing orders for user ${integration.userId} on ${integration.platform}`);
          
          const result = await platformSyncController.syncOrdersForPlatform(
            integration.userId, 
            integration.platform, 
            dateFrom
          );

          totalProcessed += result.total || 0;
          totalErrors += result.errors || 0;

          console.log(`✅ ${integration.platform} order sync: ${result.imported} imported, ${result.updated} updated`);

          // Check for urgent orders (high value or express shipping)
          await this.checkUrgentOrders(integration.userId, integration.platform);
        } catch (error) {
          console.error(`❌ Order sync failed for user ${integration.userId} on ${integration.platform}:`, error.message);
          totalErrors++;
        }
      }

      console.log(`📋 Order sync summary: ${totalProcessed} orders processed, ${totalErrors} errors`);
    } catch (error) {
      console.error('❌ Order sync cron job failed:', error);
    }
  }

  // Update order statuses from platform APIs
  async runOrderStatusUpdate() {
    try {
      // Get orders that might have status updates
      const ordersToUpdate = await PlatformOrder.find({
        'fulfillment.status': { $in: ['processing', 'shipped'] },
        'sync.lastSyncAt': { 
          $lt: new Date(Date.now() - 30 * 60 * 1000) // Haven't been synced in 30 minutes
        }
      }).limit(100);

      let updated = 0;
      let errors = 0;

      for (const order of ordersToUpdate) {
        try {
          // This would check the platform for order status updates
          // Implementation would depend on each platform's API
          
          // For now, we'll just update the sync timestamp
          await PlatformOrder.updateOne(
            { _id: order._id },
            { 'sync.lastSyncAt': new Date() }
          );

          updated++;
        } catch (error) {
          console.error(`❌ Failed to update order ${order.platformOrderId}:`, error.message);
          errors++;
        }
      }

      console.log(`🚚 Order status update: ${updated} updated, ${errors} errors`);
    } catch (error) {
      console.error('❌ Order status update cron job failed:', error);
    }
  }

  // Health check for integrations
  async runHealthCheck() {
    try {
      const integrations = await PlatformIntegration.find({ status: 'active' });
      
      for (const integration of integrations) {
        try {
          // Check token validity
          const service = this.getService(integration.platform);
          if (service) {
            await service.getValidToken(integration.userId);
            
            // Clear resolved errors if connection is successful
            if (integration.configuration.syncErrors.some(e => !e.resolved)) {
              await PlatformIntegration.updateOne(
                { _id: integration._id },
                {
                  $set: {
                    'configuration.syncErrors.$[].resolved': true
                  }
                }
              );
            }
          }
        } catch (error) {
          console.error(`❌ Health check failed for ${integration.platform} user ${integration.userId}:`, error.message);
          
          // Mark integration as error if token issues
          if (error.message.includes('token') || error.message.includes('auth')) {
            await PlatformIntegration.updateOne(
              { _id: integration._id },
              { 
                status: 'error',
                $push: {
                  'configuration.syncErrors': {
                    error: `Health check failed: ${error.message}`,
                    timestamp: new Date()
                  }
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Health check cron job failed:', error);
    }
  }

  // Check for urgent orders that need immediate attention
  async checkUrgentOrders(userId, platform) {
    try {
      const urgentOrders = await PlatformOrder.find({
        userId,
        platform,
        'fulfillment.status': 'pending',
        $or: [
          { 'platformData.totalAmount': { $gte: 500 } }, // High value orders
          { 'platformData.orderStatus': { $regex: /express|urgent|priority/i } }
        ]
      });

      if (urgentOrders.length > 0) {
        // Send notification to user about urgent orders
        console.log(`🚨 Found ${urgentOrders.length} urgent orders for user ${userId} on ${platform}`);
        
        // This would send notification to user
        // await sendNotification(userId, 'urgent_orders', { count: urgentOrders.length, platform });
      }
    } catch (error) {
      console.error('❌ Failed to check urgent orders:', error);
    }
  }

  // Get platform service (helper method)
  getService(platform) {
    const services = {
      'ebay': () => import('../services/platformServices/eBayService.js').then(m => m.default),
      'amazon': () => import('../services/platformServices/amazonService.js').then(m => m.default),
      'tiktok': () => import('../services/platformServices/tiktokService.js').then(m => m.default)
    };
    return services[platform]?.();
  }

  // Stop all cron jobs
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped ${name} cron job`);
    });
    this.jobs.clear();
  }

  // Stop specific job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.destroy();
      this.jobs.delete(jobName);
      console.log(`Stopped ${jobName} cron job`);
    }
  }

  // Get job status
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false
      };
    });
    return status;
  }

  // Manual trigger for specific sync type
  async triggerSync(syncType, userId = null, platform = null) {
    try {
      switch (syncType) {
        case 'products':
          if (userId && platform) {
            return await platformSyncController.syncProductsForPlatform(userId, platform);
          } else {
            await this.runProductSync();
          }
          break;
        case 'inventory':
          if (userId) {
            return await platformSyncController.syncInventory(userId);
          } else {
            await this.runInventorySync();
          }
          break;
        case 'orders':
          if (userId && platform) {
            return await platformSyncController.syncOrdersForPlatform(userId, platform);
          } else {
            await this.runOrderSync();
          }
          break;
        default:
          throw new Error(`Unknown sync type: ${syncType}`);
      }
    } catch (error) {
      console.error(`❌ Manual sync failed for ${syncType}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PlatformSyncCron();