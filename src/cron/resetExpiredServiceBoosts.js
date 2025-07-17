import cron from 'node-cron';
import mongoose from 'mongoose';
import { serviceModel } from '../models/index.js';
import { throwError } from '../utils/index.js';

const job = async () => {
  const date = new Date();
  try {
    const expiredServices = await serviceModel.find({ 'boostPlan.expiresAt': { $lt: date } }).limit(100);

    if (!expiredServices?.length) {
      return;
    }

    for (const expiredService of expiredServices) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const service = await serviceModel.findById(expiredService._id).session(session);
        if (!service) {
          throwError(404, 'Service not found.');
        }
        if (service.boostPlan.name === 'No Plan') {
          throwError(409, 'Service is not boosted.');
        }
        if (service.boostPlan.expiresAt >= date) {
          throwError(409, 'Service has not expired yet.');
        }

        service.boostPlan.transactionId = null;
        service.boostPlan.name = 'No Plan';
        service.boostPlan.purchasedAt = null;
        service.boostPlan.expiresAt = null;

        await service.save({ session });

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

const resetExpiredServiceBoosts = () => {
  cron.schedule('* * * * *', async () => {
    await job();
  });
};

export default resetExpiredServiceBoosts;
