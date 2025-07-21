import { google } from "googleapis";
const googleAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);

const authClient = new google.auth.JWT({
  email: googleAccount.client_email,
  key: googleAccount.private_key,
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
