import cron from 'node-cron';
import mongoose from 'mongoose';
import { productModel } from '../models/index.js';
import { throwError } from '../utils/index.js';

const job = async () => {
  const date = new Date();
  try {
    const expiredProducts = await productModel.find({ 'boostPlan.expiresAt': { $lt: date } }).limit(100);

    if (!expiredProducts?.length) {
      return;
    }

    for (const expiredProduct of expiredProducts) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const product = await productModel.findById(expiredProduct._id).session(session);
        if (!product) {
          throwError(404, 'Product not found.');
        }
        if (product.boostPlan.name === 'No Plan') {
          throwError(409, 'Product is not boosted.');
        }
        if (product.boostPlan.expiresAt >= date) {
          throwError(409, 'product has not expired yet.');
        }

        product.boostPlan.transactionId = null;
        product.boostPlan.name = 'No Plan';
        product.boostPlan.purchasedAt = null;
        product.boostPlan.expiresAt = null;

        await product.save({ session });

        await session.commitTransaction();
        await session.endSession();

      } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const resetExpiredProductBoosts = () => {
  cron.schedule('* * * * *', async () => {
    await job();
  });
};

export default resetExpiredProductBoosts;
