import { google } from "googleapis";
import { GCPServiceAccountObject } from '../../files/index.js';

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
