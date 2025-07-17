import { playDeveloperApiClient } from './index.js';

const acknowledgeSubscription = async (purchaseToken, subscriptionId) => {
  await playDeveloperApiClient.purchases.subscriptions.acknowledge({
    packageName: process.env.PACKAGE_NAME,
    subscriptionId: subscriptionId,
    token: purchaseToken,
  });
};

export default acknowledgeSubscription;
