import { stripe } from './index.js';

const customerAttachCard = async (customerId, paymentMethodId) => {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return {
    id: paymentMethod.id,
    brand: paymentMethod.card.brand,
    exp_month: paymentMethod.card.exp_month,
    exp_year: paymentMethod.card.exp_year,
    last4: paymentMethod.card.last4
  };
};

export default customerAttachCard;
