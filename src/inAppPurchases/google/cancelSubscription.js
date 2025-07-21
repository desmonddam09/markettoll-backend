import { playDeveloperApiClient } from './index.js';

const cancelSubscription = async (purchaseToken, subscriptionId) => {
  await playDeveloperApiClient.purchases.subscriptions.cancel({
    packageName: process.env.PACKAGE_NAME,
    subscriptionId: subscriptionId,
    token: purchaseToken,
  });
};

export default cancelSubscription;
