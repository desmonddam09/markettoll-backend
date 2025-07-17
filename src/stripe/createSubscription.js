import { stripe } from './index.js';

const createSubscription = async (customerId, priceId) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ['latest_invoice.payment_intent'],
  });
  const paymentIntent = subscription.latest_invoice.payment_intent;

  return {
    paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret, status: paymentIntent.status, subscriptionId: subscription.id, start: subscription.current_period_start, end: subscription.current_period_end
  };
};

export default createSubscription;
