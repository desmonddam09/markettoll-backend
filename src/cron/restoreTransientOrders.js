import cron from 'node-cron';
import { orderProductTransientModel } from '../models/index.js';

const restoreTransientOrders = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await orderProductTransientModel.restoreAllOrderProductTransient();
    } catch (err) {
      console.log(err);
    }
  });
};

export default restoreTransientOrders;
