import { stripe } from "./index.js";

const detachPaymentMethod = async (paymentMethodId) => {
  const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
  return paymentMethod;
};

export default detachPaymentMethod;
