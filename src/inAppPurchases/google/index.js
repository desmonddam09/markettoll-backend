import { google } from "googleapis";
const googleCloudAccount = JSON.parse(process.env.GOOGLE_CLOUD_ACCOUNT_JSON);
const authClient = new google.auth.JWT({
  email: googleCloudAccount.client_email,
  key: googleCloudAccount.private_key,
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
