import cron from 'node-cron';
import { productModel } from '../models/index.js';
import { sendNotification } from '../utils/index.js';

const job = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next24HoursMinus17Mins = new Date(next24Hours.getTime() - 17 * 60 * 1000);

    const products = await productModel.find({
      'boostPlan.expiresAt': {
        $gte: next24HoursMinus17Mins,
        $lt: next24Hours
      }
    }).populate('seller');

    if (!products?.length) {
      return;
    }

    for (const product of products) {
      await sendNotification.sendCommonNotificationSingleUser(null, product.seller._id, 'Product boost expiry notification.', [], `Your ${product.boostPlan.name} boost for ${product.name} will expire at ${product.boostPlan.expiresAt.toISOString().slice(0, 19).replace('T', ' ')}.`, { type: 'product boost expiry', id: product._id.toString() }, product.seller.pushNotificationTokens, true).catch(err => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
};

const sendNotificationOfBoostedProductExpiry = () => {
  cron.schedule('*/15 * * * *', async () => {
    await job();
  });
};

export default sendNotificationOfBoostedProductExpiry;
