import cron from 'node-cron';
import { userModel } from '../models/index.js';
import { sendNotification } from '../utils/index.js';

const job = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next24HoursMinus17Mins = new Date(next24Hours.getTime() - 17 * 60 * 1000);

    const users = await userModel.find({
      'subscriptionPlan.expiresAt': {
        $gte: next24HoursMinus17Mins,
        $lt: next24Hours
      }
    });

    if (!users?.length) {
      return;
    }

    for (const user of users) {
      await sendNotification.sendCommonNotificationSingleUser(null, user._id, 'Subscription renewal notification.', [], `Your ${user.subscriptionPlan.name} subscription will auto renew at ${user.subscriptionPlan.expiresAt.toISOString().slice(0, 19).replace('T', ' ')}.`, { type: 'subscription expiry', id: user.subscriptionPlan.name }, user.pushNotificationTokens, true).catch(err => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
};

const sendNotificationOfSubscriptionExpiry = () => {
  cron.schedule('*/15 * * * *', async () => {
    await job();
  });
};

export default sendNotificationOfSubscriptionExpiry;
