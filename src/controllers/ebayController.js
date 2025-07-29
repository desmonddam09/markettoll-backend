import axios from 'axios';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { refreshEbayToken } from '../utils/refreshEbayToken.js';
import querystring from 'querystring';
import nextError from '../utils/nextError.js';

/**
 * Controller to fetch user's eBay inventory.
 * Automatically refreshes token if needed.
 */

const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const REDIRECT_URI = process.env.EBAY_REDIRECT_URI;
const SCOPES = 'https://api.ebay.com/oauth/api_scope/sell.inventory';

export const connect = async (req, res) => {
  const state = req.query.state;
  console.log("returnTo", state);
  	// https://auth.ebay.com/oauth2/authorize  : production
  const url = `https://auth.sandbox.ebay.com/oauth2/authorize?${querystring.stringify({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: state,
  })}`;
  res.redirect(url);
}

export const callback = async (req, res) => {
  const { code, state } = req.query;
  console.log("state", state);
  const decoded = JSON.parse(decodeURIComponent(state));
  const userId = decoded.userId;
  const returnTo = decoded.returnTo || '/account/my-listings'
  console.log("returnTO1", userId);
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

    await EbayTokenModel.findOneAndUpdate(
      { userId },
      { accessToken: access_token, refreshToken: refresh_token, expiresAt },
      { upsert: true }
    );
    res.redirect(`http://localhost:5173${returnTo}`);
    // res.redirect(`https://markettoll.com${returnTo}`);

  } catch (err) {
    console.error('eBay callback error:', err.response?.data || err.message);
    res.status(500).send('OAuth failed');
  }
}

export const getUserProducts = async (req, res) => {
  console.log("getProducts");
  try {
    const result = getUserInventory(req.user._id);
    res.status(200).json({
      success:true,
      message: "Product uploaded successfully.",
      data: result
    })
  } catch (error) {
    console.log("error", error?.data)
    nextError(err);
  }
}

export const getUserInventory = async (userId) => {
  console.log("userID", userId);
  try {
    const tokenDoc = await EbayTokenModel.findOne({ userId });

    if (!tokenDoc) {
      return 'eBay account not connected';
    }

    let { accessToken, refreshToken, expiresAt } = tokenDoc;

    // Refresh if token is expired
    if (Date.now() >= expiresAt) {
      const newTokens = await refreshEbayToken(refreshToken);
      console.log("newOToken", newTokens);
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
    return inventory;
  } catch (err) {
    console.error('Error in getUserInventory:', err);
    throw err;
  }
};

export const fetchUserInventory = async (accessToken) => {
  const limit = 100;
  const offset = 0;
  try {
    const response = await axios.get(
      // 'https://api.ebay.com/sell/inventory/v1/inventory_item',
      `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("sdfds", response);
    // if(response.data.total === 0) {
      // createSandboxInventoryItem(accessToken, 'prod0')
    // }
    return response.data;
  } catch (err) {
    console.error('Error fetching inventory:', err.response?.data || err.message);
    throw err;
  }
};

// async function createSandboxInventoryItem(accessToken, sku) {
//   const url = `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${sku}`;

//   const payload = {
//     product: {
//       title: 'Test Product ' + sku,
//       description: 'This is a sandbox test item',
//       aspects: {
//         Brand: ['eBay Sandbox'],
//       }
//     },
//     availability: {
//       shipToLocationAvailability: {
//         quantity: 10,
//       },
//     },
//     condition: 'NEW',
//   };

//   const response = await axios.put(url, payload, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   console.log('Created SKU:', sku);
// }
