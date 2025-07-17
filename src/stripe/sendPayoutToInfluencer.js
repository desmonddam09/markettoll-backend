
import { stripe } from "./index.js";


const sendPayoutToInfluencer = async (stripeConnectedAccountId, amount, influencerId = '') => {
    try {
      const amountInCents = Math.floor(amount * 100); // Stripe uses cents
  
      // Transfer from platform to influencer's connected Stripe account
      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'usd',
        destination: stripeConnectedAccountId,
        description: `Payout to influencer ${influencerId}`,
      });
  
      // Payout from connected account to external bank
      const payout = await stripe.payouts.create({
        amount: amountInCents,
        currency: 'usd',
      }, {
        stripeAccount: stripeConnectedAccountId
      });
  
      return {
        success: true,
        transfer,
        payout,
      };
    } catch (err) {
      console.error('Stripe payout failed:', err);
      return {
        success: false,
        message: err?.message || 'Stripe payout failed',
      };
    }
  };

export {sendPayoutToInfluencer}  