import axios from 'axios';

export const refreshAmazonToken = async (refreshToken) => {
  const clientId = process.env.AMAZON_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET;

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await axios.post('https://api.amazon.com/auth/o2/token', params);
  return response.data;
};
