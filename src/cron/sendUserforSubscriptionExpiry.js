import cron from 'node-cron';
import { userModel } from '../models/index.js';
import { mailchimpController } from   "../controllers/index.js";
import { splitFullName } from '../utils/splitFullName.js';
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
        const { firstName, lastName } = splitFullName(user.name);
        try {
            await mailchimpController.updateUser(user.email.value, firstName, lastName, [], { EXPIRY_DATE: user.subscriptionPlan.expiresAt });
            await mailchimpController.tagUser(user.email.value, 'expired');
        } catch (err) {
        console.error(`Failed to tag user ${user.email}:`, err.message);
        }
    }
  } catch (err) {
    console.log(err);
  }
};

const sendUserforSubscriptionExpiry = () => {
  cron.schedule('0 0 * * *', async () => {
    await job();
  });
};

export default sendUserforSubscriptionExpiry;
