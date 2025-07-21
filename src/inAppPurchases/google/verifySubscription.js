import { throwError } from "../../utils/index.js";
import { playDeveloperApiClient } from './index.js';

const verifySubscription = async (purchaseToken) => {
  const res = await playDeveloperApiClient.purchases.subscriptionsv2.get({
    packageName: process.env.PACKAGE_NAME,
    token: purchaseToken,
  });

  if (res?.status !== 200) {
    throwError(409, 'Status not ok.');
  }
  if (res?.data?.subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
    throwError(409, 'Subscription state not active.');
  }
  if (!res?.data?.lineItems.length) {
    throwError(409, 'Details not available.');
  }
  const currentTime = new Date().getTime();
  if (!res?.data?.lineItems?.[0]?.expiryTime || currentTime >= new Date(res.data.lineItems[0].expiryTime).getTime()) {
    throwError(409, 'Subscription has expired.');
  }

  let name;
  let price;
  let availablePostings;
  let availableBoosts;
  let wishlistFeature;
  let linkedPurchaseToken = res.data.linkedPurchaseToken || null;

  switch (res.data.lineItems[0].productId) {
    case 'base1month':
      name = 'Basic Plan';
      price = 2.99;
      availablePostings = 2;
      availableBoosts = 1;
      wishlistFeature = false;
      break;
    case 'standard1month':
      name = 'Standard Plan';
      price = 5.99;
      availablePostings = 5;
      availableBoosts = 3;
      wishlistFeature = false;
      break;
    case 'premium1month':
      name = 'Premium Plan';
      price = 9.99;
      availablePostings = 10000;
      availableBoosts = 6;
      wishlistFeature = true;
      break;
    default:
      name = `case not found - ${subscriptionId}`;
      price = -1;
      availablePostings = -1;
      availableBoosts = -1;
      wishlistFeature = false;
  }

  const result = {
    purchasedAt: new Date(res.data.startTime),
    expiresAt: new Date(res.data.lineItems[0].expiryTime),
    name,
    price,
    availablePostings,
    availableBoosts,
    wishlistFeature,
    linkedPurchaseToken
  };

  return result;
};

export default verifySubscription;
