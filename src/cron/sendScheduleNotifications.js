import cron from 'node-cron';
import { userModel, adminNotificationsModel } from '../models/index.js';
import { sendNotification } from '../utils/index.js';

const job = async () => {
  try {
    const now = new Date();
    const notifications = await adminNotificationsModel.find({ type: 'schedule', scheduleDate: { $lte: now }, sentDate: null });
    if (!notifications.length) {
      return;
    }
    const users = await userModel.find({ role: 'client' });

    for (const x of notifications) {
      for (const y of users) {
        sendNotification.sendCommonNotificationSingleUser(null, y._id, x.title, [], x.body, {}, y.pushNotificationTokens, false).catch(err => { });
      }
      await adminNotificationsModel.findByIdAndUpdate(
        x._id,
        {
          $set: {
            sentDate: now
          }
        }
      );
    }
  } catch (err) {

  }
};

const sendScheduleNotifications = () => {
  cron.schedule('*/30 * * * * *', async () => {
    await job();
  });
};

export default sendScheduleNotifications;
