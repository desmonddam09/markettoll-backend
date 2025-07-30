import axios from 'axios';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { refreshEbayToken } from '../utils/refreshEbayToken.js';
import querystring from 'querystring';
import nextError from '../utils/nextError.js';
import productModel from '../models/productModel.js';

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
    res.redirect(`https://markettoll-frontend-zeta.vercel.app${returnTo}`);
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

export const getEbayOrder = async (req, res) => {
  console.log("getEbayOrders");
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
    console.log("sdfds", response.data);
    if(response.data.total) {
      // createSandboxInventoryItem(accessToken, 'prod0')
       for (const item of response.data.inventoryItems) {
        const {
          sku,
          product: { title, description, aspects, imageUrls = [] } = {},
          availability: { shipToLocationAvailability: { quantity } = {} } = {},
        } = item;

        const mappedProduct = {
          seller: userId,
          ebayId: sku,
          name: title || 'No name',
          description: description || 'No description',
          images: imageUrls.map(url => ({ url })), // map to your imagesSchema
          category: 'Others',
          subCategory: 'Others',
          country: 'US',
          state: '',
          city: '',
          fulfillmentMethod: { selfPickup: false, delivery: true },
          location: {
            type: 'Point',
            coordinates: [0, 0],
          },
          pickupAddress: '',
          price: 10, // eBay Inventory API doesn’t include price, you'd fetch separately if needed
          quantity: quantity || 0,
        };

        await productModel.saveeBayProducts(userId, sku, mappedProduct);
      }
    } else {
        const sku = 'mice_sd_01';
        const inventoryItem = {
          product: {
            title: "Wireless Mouse",
            description: "A high-quality wireless mouse.",
            aspects: {
              Brand: ["Logitech"],
              Connectivity: ["Wireless"]
            },
            imageUrls: [
              "https://example.com/images/wireless-mouse.jpg"
            ]
          },
          availability: {
            shipToLocationAvailability: {
              quantity: 50
            }
          },
          condition: "NEW",
          packageWeightAndSize: {
            dimensions: {
              length: 5,
              width: 3,
              height: 2,
              unit: "INCH"
            },
            weight: {
              value: 0.5,
              unit: "POUND"
            }
          }
        };
        try {
          const result = await axios.put(
            `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${sku}`,
            inventoryItem,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Language': 'en-US' 
              }
            }
          );
          console.log("result", result.data);
        } catch (error) {
            console.error('Error updating inventory:', error.response?.data || error.message);
            throw error;
          }
      }
    return response.data;
  } catch (err) {
    console.error('Error fetching inventory:', err.response?.data || err.message);
    throw err;
  }
};

const createSandboxInventoryItem = async (accessToken, sku) => {
  const url = `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${sku}`;

  const payload = {
    product: {
      title: `Test Product ${sku}`,
      description: 'This is a sandbox test item',
      aspects: {
        Brand: ['eBay Sandbox'],
      },
    },
    availability: {
      shipToLocationAvailability: {
        quantity: 10,
      },
    },
    condition: 'NEW',
  };

  try {
    const response = await axios.put(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }

  console.log('Created SKU:', payload);
}

const fetchEbayOrders = async (accessToken) => {
  const res = await axios.get('https://api.ebay.com/sell/fulfillment/v1/order', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    params: {
      limit: 50,
      filter: 'orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS|FULFILLED}', // optional filter
    }
  });

  return res.data.orders || [];
};