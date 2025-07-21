import { stripe } from './index.js';

const cancelSubscription = async (subscriptionId) => {
  const cancelledSubscription = await stripe.subscriptions.cancel(
    subscriptionId,
  );

  return cancelledSubscription;
};

export default cancelSubscription;
