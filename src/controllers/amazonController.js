import axios from 'axios';
import AmazonTokenModel from '../models/amazonTokenModel.js';
import { refreshAmazonToken } from '../utils/refreshAmazonToken.js';

export const redirectToAmazon = (req, res) => {
  const redirectUri = `https://sellercentral.amazon.com/apps/authorize/consent?application_id=YOUR_APP_ID&state=some_user_id&redirect_uri=${process.env.AMAZON_REDIRECT_URI}`;
  res.redirect(redirectUri);
};

export const handleAmazonCallback = async (req, res) => {
  const { code, state } = req.query;

    const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.AMAZON_CLIENT_ID,
      client_secret: process.env.AMAZON_CLIENT_SECRET,
      redirect_uri: process.env.AMAZON_REDIRECT_URI
    });

    const { refresh_token, access_token } = tokenResponse.data;

    // Save tokens in DB with user id = state
    await AmazonTokenModel.create({ userId: state, refreshToken: refresh_token, accessToken: access_token });

    res.redirect('/success'); // Or show success page
};

export const getAmazonInventory = async (userId) => {
  try {
    const tokenDoc = await AmazonToken.findOne({ userId });

    if (!tokenDoc) {
      return res.status(404).json({ message: 'Amazon account not connected' });
    }

    let { accessToken, refreshToken, expiresAt } = tokenDoc;

    // Refresh token if expired
    if (Date.now() >= expiresAt) {
      const newTokens = await refreshAmazonToken(refreshToken);
      accessToken = newTokens.access_token;

      tokenDoc.accessToken = accessToken;
      tokenDoc.refreshToken = newTokens.refresh_token || tokenDoc.refreshToken;
      tokenDoc.expiresAt = Date.now() + newTokens.expires_in * 1000;
      await tokenDoc.save();
    }

    const inventory = await fetchAmazonInventory(accessToken);
    res.status(200).json(inventory);
  } catch (err) {
    console.error('Amazon inventory error:', err);
    res.status(500).json({ error: 'Failed to fetch Amazon inventory' });
  }
};

const fetchAmazonInventory = async (accessToken) => {
  const response = await axios.get('https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-amz-access-token': accessToken
      // Additional headers for region & marketplace may be required
    }
  });

  return response.data;
};
