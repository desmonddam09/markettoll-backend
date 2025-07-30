import PlatformOrder from '../models/platformOrderModel.js';
import PlatformProduct from '../models/platformProductModel.js';
import PlatformIntegration from '../models/platformIntegrationModel.js';
import { orderProductPurchasedModel } from '../models/index.js';
import platformSyncController from './platformSyncController.js';
import eBayService from '../services/platformServices/eBayService.js';
import amazonService from '../services/platformServices/amazonService.js';
import tiktokService from '../services/platformServices/tiktokService.js';
import { throwError, sendNotification } from '../utils/index.js';

class PlatformFulfillmentController {
  // Get platform service instance
  getService(platform) {
    const services = {
      'ebay': eBayService,
      'amazon': amazonService,
      'tiktok': tiktokService
    };
    return services[platform];
  }

  // Get pending orders that need fulfillment
  async getPendingOrders(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform, page = 1, limit = 20 } = req.query;

      let query = { 
        userId, 
        'fulfillment.status': { $in: ['pending', 'processing'] },
        status: 'active'
      };

      if (platform) {
        query.platform = platform;
      }

      const orders = await PlatformOrder.find(query)
        .populate('localOrderId')
        .sort({ 'platformData.purchaseDate': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await PlatformOrder.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Pending orders retrieved',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get order details with fulfillment options
  async getOrderDetails(req, res, next) {
    try {
      const { userId } = req.user;
      const { orderId } = req.params;

      const order = await PlatformOrder.findOne({ 
        _id: orderId, 
        userId 
      }).populate('localOrderId');

      if (!order) {
        return throwError(next, 404, 'Order not found');
      }

      // Get shipping providers for the platform
      let shippingProviders = [];
      const service = this.getService(order.platform);
      
      try {
        if (order.platform === 'tiktok') {
          shippingProviders = await service.getShippingProviders(userId);
        } else {
          // Default shipping providers for eBay/Amazon
          shippingProviders = [
            { id: 'UPS', name: 'UPS' },
            { id: 'FEDEX', name: 'FedEx' },
            { id: 'USPS', name: 'USPS' },
            { id: 'DHL', name: 'DHL' },
            { id: 'OTHER', name: 'Other' }
          ];
        }
      } catch (error) {
        console.error('Error fetching shipping providers:', error);
      }

      res.status(200).json({
        success: true,
        message: 'Order details retrieved',
        data: {
          order,
          shippingProviders
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Process order fulfillment
  async fulfillOrder(req, res, next) {
    try {
      const { userId } = req.user;
      const { orderId } = req.params;
      const { 
        trackingNumber, 
        carrier, 
        carrierCode,
        shipDate,
        packageReferenceId,
        lineItems 
      } = req.body;

      const order = await PlatformOrder.findOne({ 
        _id: orderId, 
        userId 
      });

      if (!order) {
        return throwError(next, 404, 'Order not found');
      }

      if (order.fulfillment.status === 'shipped') {
        return throwError(next, 400, 'Order already shipped');
      }

      // Prepare fulfillment data based on platform
      let fulfillmentData;
      switch (order.platform) {
        case 'ebay':
          fulfillmentData = {
            lineItems: lineItems || order.items.map(item => ({
              lineItemId: item.platformProductId,
              quantity: item.quantity
            })),
            trackingNumber,
            carrier: carrierCode || carrier,
            shippedDate: shipDate || new Date().toISOString()
          };
          break;

        case 'amazon':
          fulfillmentData = {
            packageReferenceId: packageReferenceId || `PKG-${Date.now()}`,
            carrierCode: carrierCode || 'OTHER',
            trackingNumber,
            shipDate: shipDate || new Date().toISOString(),
            orderItems: lineItems || order.items.map(item => ({
              orderItemId: item.itemStatus, // Amazon uses order item ID
              quantity: item.quantity
            }))
          };
          break;

        case 'tiktok':
          fulfillmentData = {
            trackingNumber,
            providerId: carrierCode || 'OTHER',
            providerName: carrier || 'Other'
          };
          break;

        default:
          return throwError(next, 400, 'Unsupported platform');
      }

      // Update fulfillment on platform
      await platformSyncController.updateOrderFulfillment(
        userId, 
        order.platformOrderId, 
        order.platform, 
        fulfillmentData
      );

      // Update local order if it exists
      if (order.localOrderId) {
        await orderProductPurchasedModel.findByIdAndUpdate(
          order.localOrderId,
          {
            fulfillmentStatus: 'shipped',
            trackingNumber,
            carrier,
            shipDate: shipDate || new Date()
          }
        );
      }

      // Update inventory for fulfilled items
      await this.updateInventoryAfterFulfillment(userId, order);

      // Send notification
      await this.sendFulfillmentNotification(order, {
        trackingNumber,
        carrier,
        shipDate: shipDate || new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Order fulfilled successfully',
        data: {
          orderId: order._id,
          platformOrderId: order.platformOrderId,
          trackingNumber,
          carrier,
          fulfillmentDate: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk fulfill orders
  async bulkFulfillOrders(req, res, next) {
    try {
      const { userId } = req.user;
      const { orders } = req.body; // Array of { orderId, trackingNumber, carrier, etc. }

      const results = [];
      const errors = [];

      for (const orderFulfillment of orders) {
        try {
          const order = await PlatformOrder.findOne({ 
            _id: orderFulfillment.orderId, 
            userId 
          });

          if (!order) {
            errors.push({
              orderId: orderFulfillment.orderId,
              error: 'Order not found'
            });
            continue;
          }

          // Process individual fulfillment
          await this.processSingleFulfillment(userId, order, orderFulfillment);
          
          results.push({
            orderId: order._id,
            platformOrderId: order.platformOrderId,
            success: true
          });
        } catch (error) {
          errors.push({
            orderId: orderFulfillment.orderId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Bulk fulfillment completed',
        data: {
          successful: results.length,
          failed: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Process single fulfillment (helper method)
  async processSingleFulfillment(userId, order, fulfillmentData) {
    let platformFulfillmentData;
    
    switch (order.platform) {
      case 'ebay':
        platformFulfillmentData = {
          lineItems: order.items.map(item => ({
            lineItemId: item.platformProductId,
            quantity: item.quantity
          })),
          trackingNumber: fulfillmentData.trackingNumber,
          carrier: fulfillmentData.carrier,
          shippedDate: fulfillmentData.shipDate || new Date().toISOString()
        };
        break;

      case 'amazon':
        platformFulfillmentData = {
          packageReferenceId: fulfillmentData.packageReferenceId || `PKG-${Date.now()}`,
          carrierCode: fulfillmentData.carrierCode || 'OTHER',
          trackingNumber: fulfillmentData.trackingNumber,
          shipDate: fulfillmentData.shipDate || new Date().toISOString(),
          orderItems: order.items.map(item => ({
            orderItemId: item.itemStatus,
            quantity: item.quantity
          }))
        };
        break;

      case 'tiktok':
        platformFulfillmentData = {
          trackingNumber: fulfillmentData.trackingNumber,
          providerId: fulfillmentData.carrierCode || 'OTHER',
          providerName: fulfillmentData.carrier || 'Other'
        };
        break;
    }

    // Update fulfillment on platform
    await platformSyncController.updateOrderFulfillment(
      userId, 
      order.platformOrderId, 
      order.platform, 
      platformFulfillmentData
    );

    // Update inventory
    await this.updateInventoryAfterFulfillment(userId, order);
  }

  // Update inventory after fulfillment
  async updateInventoryAfterFulfillment(userId, order) {
    try {
      for (const item of order.items) {
        if (item.localProductId) {
          // Update local product quantity
          const product = await PlatformProduct.findById(item.localProductId);
          if (product) {
            const newQuantity = Math.max(0, product.quantity - item.quantity);
            await PlatformProduct.findByIdAndUpdate(
              item.localProductId,
              { 
                quantity: newQuantity,
                quantitySold: (product.quantitySold || 0) + item.quantity
              }
            );

            // Sync inventory to all platforms for this product
            await platformSyncController.syncInventory(userId, item.localProductId);
          }
        }
      }
    } catch (error) {
      console.error('Error updating inventory after fulfillment:', error);
    }
  }

  // Send fulfillment notification
  async sendFulfillmentNotification(order, fulfillmentData) {
    try {
      // Send notification to buyer if email available
      if (order.platformData.buyerInfo?.email) {
        const notificationData = {
          type: 'order_shipped',
          orderId: order.platformOrderId,
          trackingNumber: fulfillmentData.trackingNumber,
          carrier: fulfillmentData.carrier,
          estimatedDelivery: this.calculateEstimatedDelivery(fulfillmentData.carrier)
        };

        // This would integrate with your notification system
        await sendNotification(
          order.platformData.buyerInfo.email,
          'Your order has been shipped',
          'order-shipped-template',
          notificationData
        );
      }
    } catch (error) {
      console.error('Error sending fulfillment notification:', error);
    }
  }

  // Calculate estimated delivery date
  calculateEstimatedDelivery(carrier) {
    const businessDays = {
      'UPS': 3,
      'FEDEX': 2,
      'USPS': 5,
      'DHL': 3,
      'OTHER': 7
    };

    const days = businessDays[carrier] || 7;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate;
  }

  // Get fulfillment analytics
  async getFulfillmentAnalytics(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform, dateFrom, dateTo } = req.query;

      let matchQuery = { userId };
      if (platform) matchQuery.platform = platform;
      
      if (dateFrom || dateTo) {
        matchQuery['platformData.purchaseDate'] = {};
        if (dateFrom) matchQuery['platformData.purchaseDate'].$gte = new Date(dateFrom);
        if (dateTo) matchQuery['platformData.purchaseDate'].$lte = new Date(dateTo);
      }

      const analytics = await PlatformOrder.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              platform: '$platform',
              status: '$fulfillment.status'
            },
            count: { $sum: 1 },
            totalValue: { $sum: '$platformData.totalAmount' }
          }
        },
        {
          $group: {
            _id: '$_id.platform',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count',
                totalValue: '$totalValue'
              }
            },
            totalOrders: { $sum: '$count' },
            totalValue: { $sum: '$totalValue' }
          }
        }
      ]);

      // Calculate fulfillment rate
      const fulfillmentStats = await PlatformOrder.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$platform',
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$fulfillment.status', 'pending'] }, 1, 0]
              }
            },
            processing: {
              $sum: {
                $cond: [{ $eq: ['$fulfillment.status', 'processing'] }, 1, 0]
              }
            },
            shipped: {
              $sum: {
                $cond: [{ $eq: ['$fulfillment.status', 'shipped'] }, 1, 0]
              }
            },
            delivered: {
              $sum: {
                $cond: [{ $eq: ['$fulfillment.status', 'delivered'] }, 1, 0]
              }
            }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: 'Fulfillment analytics retrieved',
        data: {
          analytics,
          fulfillmentStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Auto-fulfill orders based on criteria
  async autoFulfillOrders(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform, criteria = {} } = req.body;

      // Get platform integration settings
      const integration = await PlatformIntegration.findOne({ 
        userId, 
        platform,
        'configuration.autoFulfillment': true 
      });

      if (!integration) {
        return throwError(next, 400, 'Auto-fulfillment not enabled for this platform');
      }

      // Build query for auto-fulfillment criteria
      let query = {
        userId,
        platform,
        'fulfillment.status': 'pending',
        status: 'active'
      };

      // Add criteria filters
      if (criteria.maxOrderValue) {
        query['platformData.totalAmount'] = { $lte: criteria.maxOrderValue };
      }

      if (criteria.domesticOnly) {
        query['platformData.shippingAddress.country'] = 'US'; // or user's country
      }

      if (criteria.specificProducts) {
        query['items.localProductId'] = { $in: criteria.specificProducts };
      }

      const ordersToFulfill = await PlatformOrder.find(query).limit(50); // Limit for safety

      const results = [];
      for (const order of ordersToFulfill) {
        try {
          // Auto-generate tracking number (this would integrate with your shipping provider)
          const trackingNumber = this.generateTrackingNumber();
          
          await this.processSingleFulfillment(userId, order, {
            trackingNumber,
            carrier: 'AUTO_FULFILLMENT',
            carrierCode: 'OTHER'
          });

          results.push({
            orderId: order._id,
            platformOrderId: order.platformOrderId,
            trackingNumber,
            success: true
          });
        } catch (error) {
          results.push({
            orderId: order._id,
            platformOrderId: order.platformOrderId,
            success: false,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Auto-fulfillment completed',
        data: {
          processed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate tracking number (placeholder - integrate with shipping provider)
  generateTrackingNumber() {
    return 'TRK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Update order status (for webhook integration)
  async updateOrderStatus(req, res, next) {
    try {
      const { userId } = req.user;
      const { orderId } = req.params;
      const { status, trackingNumber, deliveryDate } = req.body;

      const order = await PlatformOrder.findOneAndUpdate(
        { _id: orderId, userId },
        {
          'fulfillment.status': status,
          'fulfillment.trackingNumber': trackingNumber,
          'fulfillment.deliveredDate': deliveryDate ? new Date(deliveryDate) : undefined,
          'sync.lastSyncAt': new Date()
        },
        { new: true }
      );

      if (!order) {
        return throwError(next, 404, 'Order not found');
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PlatformFulfillmentController();