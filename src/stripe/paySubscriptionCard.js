import { stripe } from "./index.js";

const paySubscriptionCard = async (paymentIntentId, paymentMethodId) => {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });

  return paymentIntent;
};

export default paySubscriptionCard;
