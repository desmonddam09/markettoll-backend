import PlatformIntegration from '../models/platformIntegrationModel.js';
import eBayService from '../services/platformServices/eBayService.js';
import amazonService from '../services/platformServices/amazonService.js';
import tiktokService from '../services/platformServices/tiktokService.js';
import { throwError } from '../utils/index.js';
import axios from 'axios';
import querystring from 'querystring';


const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const DEV_ID = process.env.EBAY_DEV_ID;
const REDIRECT_URI = process.env.EBAY_REDIRECT_URI;
const SCOPES = ['https://api.ebay.com/oauth/api_scope/sell.inventory', 'https://api.ebay.com/oauth/api_scope/sell.fulfillment'];

class PlatformConnectionController {
  // eBay Connection
  async connectEbay(req, res, next) {
    console.log(`https://auth.sandbox.ebay.com/oauth2/authorize`);
    console.log(process.env.EBAY_CLIENT_ID);
    const state = req.query.state;
    try {
      const authUrl = `https://auth.sandbox.ebay.com/oauth2/authorize?${querystring.stringify({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(' '),
        state: state,
      })}`;

      res.status(200).json({
        success: true,
        message: 'eBay authorization URL generated',
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  async ebayCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      const decoded = JSON.parse(decodeURIComponent(state));
      const { userId, returnTo } = decoded;
      console.log("userId, returnTo", userId, returnTo);

      // Exchange code for tokens
      const response = await axios.post(
        `https://api.${process.env.NODE_ENV === 'production' ? '' : 'sandbox.'}ebay.com/identity/v1/oauth2/token`,
        querystring.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.EBAY_REDIRECT_URI,
        }),
        {
          auth: {
            username: process.env.EBAY_CLIENT_ID,
            password: process.env.EBAY_CLIENT_SECRET,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;

      // Save integration
      await PlatformIntegration.findOneAndUpdate(
        { userId, platform: 'ebay' },
        {
          credentials: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            clientId: process.env.EBAY_CLIENT_ID,
            clientSecret: process.env.EBAY_CLIENT_SECRET,
          },
          status: 'active',
          configuration: {
            autoSync: true,
            syncInterval: 12,
            syncProducts: true,
            syncInventory: true,
            syncOrders: true,
          }
        },
        { upsert: true, new: true }
      );

      res.redirect(`http://localhost:5173${returnTo}`);
    } catch (error) {
      console.error('eBay callback error:', error);
      res.redirect(`http://localhost:5173/account/my-listings?error=ebay_connection_failed`);
    }
  }

  // Amazon Connection
  async connectAmazon(req, res, next) {
    try {
      const { userId } = req.user;
      const state = JSON.stringify({ userId });
      
      const authUrl = `https://sellercentral.amazon.com/apps/authorize/consent?${querystring.stringify({
        application_id: process.env.AMAZON_CLIENT_ID,
        state: encodeURIComponent(state),
        redirect_uri: process.env.AMAZON_REDIRECT_URI,
        version: 'beta'
      })}`;

      res.status(200).json({
        success: true,
        message: 'Amazon authorization URL generated',
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  async amazonCallback(req, res, next) {
    try {
      const { code, state, selling_partner_id } = req.query;
      const decoded = JSON.parse(decodeURIComponent(state));
      const { userId } = decoded;

      // Exchange code for tokens
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.AMAZON_CLIENT_ID,
        client_secret: process.env.AMAZON_CLIENT_SECRET,
        redirect_uri: process.env.AMAZON_REDIRECT_URI
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Save integration
      await PlatformIntegration.findOneAndUpdate(
        { userId, platform: 'amazon' },
        {
          credentials: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
            sellerId: selling_partner_id,
            marketplaceId: process.env.AMAZON_MARKETPLACE_ID || 'ATVPDKIKX0DER',
            clientId: process.env.AMAZON_CLIENT_ID,
            clientSecret: process.env.AMAZON_CLIENT_SECRET,
          },
          status: 'active',
          configuration: {
            autoSync: true,
            syncInterval: 12,
            syncProducts: true,
            syncInventory: true,
            syncOrders: true,
          }
        },
        { upsert: true, new: true }
      );

      res.redirect(`${process.env.FRONTEND_URL}/account/integrations?connected=amazon`);
    } catch (error) {
      console.error('Amazon callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/account/integrations?error=amazon_connection_failed`);
    }
  }

  // TikTok Shop Connection
  async connectTikTok(req, res, next) {
    try {
      const { userId } = req.user;
      const state = JSON.stringify({ userId });
      
      const authUrl = `https://services.tiktokshop.com/open/authorize?${querystring.stringify({
        service_id: process.env.TIKTOK_APP_KEY,
        state: encodeURIComponent(state)
      })}`;

      res.status(200).json({
        success: true,
        message: 'TikTok Shop authorization URL generated',
        data: { authUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  async tiktokCallback(req, res, next) {
    try {
      const { code, state, shop_id } = req.query;
      const decoded = JSON.parse(decodeURIComponent(state));
      const { userId } = decoded;

      // Exchange code for tokens
      const timestamp = Math.floor(Date.now() / 1000);
      const params = {
        app_key: process.env.TIKTOK_APP_KEY,
        timestamp: timestamp,
        auth_code: code,
        grant_type: 'authorized_code'
      };

      // Generate signature
      const keys = Object.keys(params).sort();
      let signString = '';
      for (const key of keys) {
        signString += key + params[key];
      }
      const finalString = process.env.TIKTOK_APP_SECRET + signString + process.env.TIKTOK_APP_SECRET;
      const sign = require('crypto').createHmac('sha256', process.env.TIKTOK_APP_SECRET).update(finalString).digest('hex');
      
      params.sign = sign;

      const response = await axios.post(`https://open-api.tiktokglobalshop.com/authorization/202309/token/get`, null, {
        params
      });

      if (response.data.code === 0) {
        const { access_token, refresh_token, access_token_expire_in } = response.data.data;

        // Save integration
        await PlatformIntegration.findOneAndUpdate(
          { userId, platform: 'tiktok' },
          {
            credentials: {
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresAt: new Date(Date.now() + access_token_expire_in * 1000),
              storeId: shop_id,
              clientId: process.env.TIKTOK_APP_KEY,
              clientSecret: process.env.TIKTOK_APP_SECRET,
            },
            status: 'active',
            configuration: {
              autoSync: true,
              syncInterval: 12,
              syncProducts: true,
              syncInventory: true,
              syncOrders: true,
            }
          },
          { upsert: true, new: true }
        );

        res.redirect(`${process.env.FRONTEND_URL}/account/integrations?connected=tiktok`);
      } else {
        throw new Error(`TikTok token exchange failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('TikTok callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/account/integrations?error=tiktok_connection_failed`);
    }
  }

  // Get user's platform connections
  async getConnections(req, res, next) {
    try {
      const { userId } = req.user;
      
      const integrations = await PlatformIntegration.find({ userId }).select({
        platform: 1,
        status: 1,
        'configuration.autoSync': 1,
        'configuration.lastSyncAt': 1,
        'configuration.syncErrors': 1,
        createdAt: 1
      });

      const connections = integrations.map(integration => ({
        platform: integration.platform,
        status: integration.status,
        connected: integration.status === 'active',
        connectedAt: integration.createdAt,
        lastSync: integration.configuration.lastSyncAt,
        autoSync: integration.configuration.autoSync,
        errors: integration.configuration.syncErrors?.filter(e => !e.resolved).length || 0
      }));

      res.status(200).json({
        success: true,
        message: 'Platform connections retrieved',
        data: connections
      });
    } catch (error) {
      next(error);
    }
  }

  // Update connection settings
  async updateConnectionSettings(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform } = req.params;
      const { autoSync, syncProducts, syncInventory, syncOrders, syncInterval } = req.body;

      const integration = await PlatformIntegration.findOneAndUpdate(
        { userId, platform },
        {
          'configuration.autoSync': autoSync,
          'configuration.syncProducts': syncProducts,
          'configuration.syncInventory': syncInventory,
          'configuration.syncOrders': syncOrders,
          'configuration.syncInterval': syncInterval
        },
        { new: true }
      );

      if (!integration) {
        return throwError(next, 404, 'Platform integration not found');
      }

      res.status(200).json({
        success: true,
        message: 'Connection settings updated',
        data: integration.configuration
      });
    } catch (error) {
      next(error);
    }
  }

  // Disconnect platform
  async disconnect(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform } = req.params;

      const integration = await PlatformIntegration.findOneAndUpdate(
        { userId, platform },
        { status: 'inactive' },
        { new: true }
      );

      if (!integration) {
        return throwError(next, 404, 'Platform integration not found');
      }

      res.status(200).json({
        success: true,
        message: `${platform} disconnected successfully`,
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  // Test connection
  async testConnection(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform } = req.params;

      const integration = await PlatformIntegration.findOne({ userId, platform });
      if (!integration) {
        return throwError(next, 404, 'Platform integration not found');
      }

      let testResult;
      switch (platform) {
        case 'ebay':
          testResult = await eBayService.getValidToken(userId);
          break;
        case 'amazon':
          testResult = await amazonService.initializeClient(userId);
          break;
        case 'tiktok':
          testResult = await tiktokService.getValidToken(userId);
          break;
        default:
          return throwError(next, 400, 'Unsupported platform');
      }

      res.status(200).json({
        success: true,
        message: `${platform} connection test successful`,
        data: { connected: true, testedAt: new Date() }
      });
    } catch (error) {
      console.error(`${req.params.platform} connection test failed:`, error);
      res.status(200).json({
        success: false,
        message: `${req.params.platform} connection test failed`,
        data: { connected: false, error: error.message, testedAt: new Date() }
      });
    }
  }

  // Resolve sync errors
  async resolveSyncErrors(req, res, next) {
    try {
      const { userId } = req.user;
      const { platform } = req.params;

      await PlatformIntegration.updateOne(
        { userId, platform },
        {
          $set: {
            'configuration.syncErrors.$[].resolved': true
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Sync errors resolved',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PlatformConnectionController();