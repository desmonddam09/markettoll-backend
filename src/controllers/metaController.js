import axios from 'axios';

export const trachController = async (req, res) => {
  try {
    const { eventName, email, eventId, data } = req.body;
    console.log("sdfsfsfsfsdfsdfsfsfs", req.body);
    // Prepare payload for Meta CAPI
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user_data: {
            em: [hashEmail(email)], // Email must be hashed (SHA256)
          },
          custom_data: data,
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