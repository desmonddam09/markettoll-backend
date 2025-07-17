import cron from 'node-cron';
import mongoose from 'mongoose';
import { userModel } from '../models/index.js';
import { throwError } from '../utils/index.js';

const job = async () => {
  try {
    const date = new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

    const users = await userModel.find({
      'subscriptionPlan.name': 'Free Plan',
      'subscriptionPlan.expiresAt': { $lt: date },
    }).limit(100);

    if (!users.length) {
      return;
    }

    for (const user of users) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const tUser = await userModel.findById(user._id).session(session);
        if (tUser.subscriptionPlan.name !== 'Free Plan') {
          throwError(409, 'User doest not have a free plan.');
        }
        if (tUser.subscriptionPlan.expiresAt >= date) {
          throwError(409, 'User subscription plan has not expired yet.');
        }

        tUser.subscriptionPlan.platform = 'none';
        tUser.subscriptionPlan.transactionId = null;
        tUser.subscriptionPlan.name = 'Free Plan';
        tUser.subscriptionPlan.availablePostings = 1;
        tUser.subscriptionPlan.availableBoosts = 0;
        tUser.subscriptionPlan.wishlistFeature = false;
        tUser.subscriptionPlan.renewedAt = date;
        tUser.subscriptionPlan.expiresAt = nextMonth;
        tUser.subscriptionPlan.status = 'active';

        await tUser.save({ session });

        await session.commitTransaction();
        await session.endSession();
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        console.log(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const renewSubscriptionFreePlan = async () => {
  cron.schedule('* * * * *', async () => {
    await job();
  });
};

export default renewSubscriptionFreePlan;
