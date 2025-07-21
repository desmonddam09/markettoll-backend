import { stripe } from './index.js';

const createTransfer = async (amount, destinationAccount) => {
  const roundedAmount = parseFloat(amount.toFixed(2));

  const transfer = await stripe.transfers.create({
    amount: roundedAmount * 100,
    currency: 'usd',
    destination: destinationAccount
  });

  return transfer;
};

export default createTransfer;
