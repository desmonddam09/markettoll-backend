import axios from 'axios';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { refreshEbayToken } from '../utils/refreshEbayToken.js';
import querystring from 'querystring';

/**
 * Controller to fetch user's eBay inventory.
 * Automatically refreshes token if needed.
 */

const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const REDIRECT_URI = process.env.EBAY_REDIRECT_URI;
const SCOPES = 'https://api.ebay.com/oauth/api_scope/sell.inventory';

export const connect = async (req, res) => {
  	// https://auth.ebay.com/oauth2/authorize  : production
    const url = `https://auth.sandbox.ebay.com/oauth2/authorize?${querystring.stringify({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
  })}`;
  res.redirect(url);
}

export const callback = async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post(
      // 'https://api.ebay.com/identity/v1/oauth2/token',   production
      'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Replace with your auth user ID
    const userId = req.user?.id || null;

    await EbayTokenModel.findOneAndUpdate(
      { userId },
      { accessToken: access_token, refreshToken: refresh_token, expiresAt },
      { upsert: true }
    );

    res.send('eBay store connected successfully!');
  } catch (err) {
    console.error('eBay callback error:', err.response?.data || err.message);
    res.status(500).send('OAuth failed');
  }
}

export const getUserInventory = async (userId) => {
  try {
    const tokenDoc = await EbayTokenModel.findOne({ userId });

    if (!tokenDoc) {
      return res.status(404).json({ message: 'eBay account not connected' });
    }

    let { accessToken, refreshToken, expiresAt } = tokenDoc;

    // Refresh if token is expired
    if (Date.now() >= expiresAt) {
      const newTokens = await refreshEbayToken(refreshToken);
      accessToken = newTokens.access_token;

      // Update token in DB
      tokenDoc.accessToken = newTokens.access_token;
      tokenDoc.expiresAt = Date.now() + newTokens.expires_in * 1000;
      tokenDoc.refreshToken = newTokens.refresh_token || tokenDoc.refreshToken;
      await tokenDoc.save();
    }

    // Fetch inventory with fresh token
    const inventory = await fetchUserInventory(accessToken);
    console.log("product data", inventory);
  } catch (err) {
    console.error('Error in getUserInventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const fetchUserInventory = async (accessToken) => {

  try {
    const response = await axios.get(
      'https://api.ebay.com/sell/inventory/v1/inventory_item',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error('Error fetching inventory:', err.response?.data || err.message);
    throw err;
  }
};


