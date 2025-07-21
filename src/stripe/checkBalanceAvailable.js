import { stripe } from './index.js';

const checkBalanceAvailable = async (valueInCents) => {
  const balance = await stripe.balance.retrieve();

  let total = 0;
  for (const x of balance.available) {
    if (x.currency === 'usd') {
      total += x.amount;
    }
  }
  console.log((total / 100).toFixed(2));
  return valueInCents < total;
};

export default checkBalanceAvailable;
