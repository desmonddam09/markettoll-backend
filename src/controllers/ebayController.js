import axios from 'axios';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { refreshEbayToken } from '../utils/refreshEbayToken.js';
import querystring from 'querystring';
import nextError from '../utils/nextError.js';
import productModel from '../models/productModel.js';
import xml2js from 'xml2js';

/**
 * Controller to fetch user's eBay inventory.
 * Automatically refreshes token if needed.
 */

const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const DEV_ID = process.env.EBAY_DEV_ID;
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
    const products = result.map(item => ({
      ebayItemId: item.ItemID,
      name: item.Title,
      sku: item.SKU || null,
      price: item.SellingStatus?.CurrentPrice?._,
      quantity: item.Quantity,
      quantitySold: item.SellingStatus?.QuantitySold,
      imageUrl: item.PictureDetails?.PictureURL,
      listingStatus: item.SellingStatus?.ListingStatus,
    }));
    console.log("products", products);
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

  const EBAY_API_ENDPOINT = 'https://api.ebay.com/ws/api/.dll'
  const devId = DEV_ID;
  const appId = CLIENT_ID;
  const certId = CLIENT_SECRET;
  const siteId = 0;

  async function getActiveListings(pageNumber = 1) {
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
      'X-EBAY-API-DEV-NAME': devId,
      'X-EBAY-API-APP-NAME': appId,
      'X-EBAY-API-CERT-NAME': certId,
      'X-EBAY-API-SITEID': siteId,
      'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
    };

    const response = await axios.post(EBAY_API_ENDPOINT, xmlBody, { headers });
    const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });

    const items = result?.GetMyeBaySellingResponse?.ActiveList?.ItemArray?.Item || [];
    return Array.isArray(items) ? items : [items];
  }

  let allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const products = await getActiveListings(page);
    allProducts.push(...products);
    hasMore = products.length === 100; // if less than 100, it's the last page
    page++;
  }

  return allProducts;
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