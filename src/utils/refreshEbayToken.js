import axios from 'axios';
import EbayTokenModel from '../models/eBayTokenModel.js';

const CLIENT_ID = process.env.EBAY_CLIENT_ID;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

export async function refreshEbayToken(userId) {
  const tokenDoc = await EbayTokenModel.findOne({ userId });
  if (!tokenDoc || !tokenDoc.refreshToken) throw new Error('No refresh token found');

  const response = await axios.post(
    'https://api.ebay.com/identity/v1/oauth2/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenDoc.refreshToken,
      scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
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

  const { access_token, expires_in } = response.data;
  const newExpiresAt = new Date(Date.now() + expires_in * 1000);

  tokenDoc.accessToken = access_token;
  tokenDoc.expiresAt = newExpiresAt;
  await tokenDoc.save();

  return access_token;
}
