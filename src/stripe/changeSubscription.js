import { stripe } from './index.js';

const changeSubscription = async (subscriptionId, priceId, prorate) => {
  const changedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: prorate ? 'create_prorations' : 'none'
  });

  return changedSubscription;
};

export default changeSubscription;
