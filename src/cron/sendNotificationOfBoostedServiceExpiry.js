import cron from 'node-cron';
import { serviceModel } from '../models/index.js';
import { sendNotification } from '../utils/index.js';

const job = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next24HoursMinus17Mins = new Date(next24Hours.getTime() - 17 * 60 * 1000);

    const services = await serviceModel.find({
      'boostPlan.expiresAt': {
        $gte: next24HoursMinus17Mins,
        $lt: next24Hours
      }
    }).populate('seller');

    if (!services?.length) {
      return;
    }

    for (const service of services) {
      await sendNotification.sendCommonNotificationSingleUser(null, service.seller._id, 'Service boost expiry notification.', [], `Your ${service.boostPlan.name} boost for ${service.name} will expire at ${service.boostPlan.expiresAt.toISOString().slice(0, 19).replace('T', ' ')}.`, { type: 'service boost expiry', id: service._id.toString() }, service.seller.pushNotificationTokens, true).catch(err => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
};

const sendNotificationOfBoostedServiceExpiry = () => {
  cron.schedule('*/15 * * * *', async () => {
    await job();
  });
};

export default sendNotificationOfBoostedServiceExpiry;
