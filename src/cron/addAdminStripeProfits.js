import cron from 'node-cron';
import mongoose from 'mongoose';
import { calculateStripeAdminProfitsModel, stripeProfitsModel } from '../models/index.js';
import { throwError } from '../utils/index.js';
import { stripe } from '../stripe/index.js';

const job = async () => {
  try {
    const adminProfits = await calculateStripeAdminProfitsModel.find().limit(100);

    if (!adminProfits.length) {
      return;
    }

    for (const adminProfit of adminProfits) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const adminProfitTran = await calculateStripeAdminProfitsModel.findById(adminProfit._id).session(session);
        const paymentIntent = await stripe.paymentIntents.retrieve(adminProfitTran.paymentIntentId);
        if (!paymentIntent.latest_charge) {
          throwError(404, 'Latest charge not found.');
        }
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        if (!charge.balance_transaction) {
          throwError(404, 'Balance transaction not found.');
        }
        const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
        const amount = balanceTransaction.amount / 100;
        const fee = balanceTransaction.fee / 100;
        const profit = (amount - fee - adminProfitTran.transferAmount).toFixed(2);

        const stpr = await stripeProfitsModel.findOneAndUpdate(
          {
            type: 'adminProfits'
          },
          {
            $inc: { value: profit }
          },
          { new: true, upsert: true, session }
        );
        stpr.value = stpr.value.toFixed(2);
        await stpr.save({ session });

        await adminProfitTran.deleteOne({ session });
        await session.commitTransaction();
        await session.endSession();
      } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        throw err;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const addAdminStripeProfits = async () => {
  cron.schedule('* * * * *', async () => {
    await job();
  });
};

export default addAdminStripeProfits;
