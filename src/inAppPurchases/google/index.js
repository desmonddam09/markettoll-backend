import { google } from "googleapis";
import { GCPServiceAccountObject } from '../../files/index.js';
import axios from 'axios';

const authClient = new google.auth.JWT({
  email: GCPServiceAccountObject.client_email,
  key: GCPServiceAccountObject.private_key,
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

export { default as verifySubscription } from './verifySubscription.js';
export { default as acknowledgeSubscription } from './acknowledgeSubscription.js';
export { default as webhook } from './webhook.js';
export { default as consumeProduct } from './consumeProduct.js';
export { default as verifyProduct } from './verifyProduct.js';
export { default as cancelSubscription } from './cancelSubscription.js';

export const playDeveloperApiClient = google.androidpublisher({
  version: "v3",
  auth: authClient,
});

export const trackSubscribe = async (req, res) => {
  try {
    const { email, eventId, value, currency } = req.body;

    // Prepare payload for Meta CAPI
    const payload = {
      data: [
        {
          event_name: 'Subscribe',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user_data: {
            em: [hashEmail(email)], // Email must be hashed (SHA256)
          },
          custom_data: {
            value,
            currency,
          },
          action_source: 'website',
        },
      ],
      access_token: process.env.META_CONVERSION_API_TOKEN,
    };

    // Send to Meta CAPI
    const pixelId = process.env.META_PIXEL_ID;
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;

    const response = await axios.post(url, payload);

    res.status(200).json({ success: true, metaResponse: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
};

// Helper to hash email as required by Meta CAPI
import crypto from 'crypto';
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}
