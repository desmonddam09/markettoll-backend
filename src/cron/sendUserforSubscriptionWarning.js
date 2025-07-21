import cron from 'node-cron';
import { userModel } from '../models/index.js';
import { mailchimpController } from   "../controllers/index.js";

const job = async () => {
  try {
    const now = new Date();
    const next2days = new Date(now.getTime() + 2*24 * 60 * 60 * 1000);
    const next3days = new Date(next24Hours.getTime() + 3*24 * 60 * 60 * 1000);

    const users = await userModel.find({
      'subscriptionPlan.expiresAt': {
        $gte: next2days,
        $lt: next3days
      }
    });

    if (!users?.length) {
      return;
    }

    for (const user of users) {
        try {
            await mailchimpController.updateUser(user.email.value, user.firstName, user.lastName, [], { EXPIRY_DATE: user.subscriptionPlan.expiresAt });
            await mailchimpController.tagUser(user.email.value, 'expiring_soon');
        } catch (err) {
        console.error(`Failed to tag user ${user.email}:`, err.message);
        }
    }
  } catch (err) {
    console.log(err);
  }
};

const sendUserforSubscriptionWarning = () => {
  cron.schedule('0 0 * * *', async () => {
    await job();
  });
};

export default sendUserforSubscriptionWarning;
