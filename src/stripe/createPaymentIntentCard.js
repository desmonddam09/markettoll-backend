import { stripe } from './index.js';

const createPaymentIntentCard = async (amount, customerId, paymentMethodId) => {
  const roundAmount = (amount * 100).toFixed(0);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: roundAmount,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    setup_future_usage: 'off_session', // helps reduce 3DS for future payments
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic', // use 'automatic' instead of 'any'
      },
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status
  };
};

export default createPaymentIntentCard;
