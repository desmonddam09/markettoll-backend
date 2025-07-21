import { stripe } from './index.js';

const createAdminPayout = async (amount) => {
  const roundAmount = (amount * 100).toFixed(0);
  const payout = await stripe.payouts.create({
    amount: roundAmount,
    currency: 'usd'
  });

  return payout;
};

export default createAdminPayout;
