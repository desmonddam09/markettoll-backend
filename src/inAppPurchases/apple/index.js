import APV from 'node-apple-receipt-verify';

APV.config({
  secret: process.env.IAP_IOS_APP_SPECIFIC_SHARED_SECRET,
  environment: ["production", "sandbox"],
});

export { default as verifySubscription } from './verifySubscription.js';
export { default as webhook } from './webhook.js';
export { default as verifyProduct } from './verifyProduct.js';

export const AppleReceiptVerify = APV;
