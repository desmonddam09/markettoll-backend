import cron from 'node-cron';
import AmazonTokenModel from '../models/amazonTokenModel.js';
import { getAmazonInventory } from '../controllers/amazonController.js';

const startAmazonInventoryJob = () => {
  // Run every 12 hours (you can change the schedule)
  cron.schedule('0 */12 * * *', async () => {
    console.log('⏰ Running eBay inventory sync job...');

    const tokens = await AmazonTokenModel.find({});
    for (const tokenData of tokens) {
      try {
        const { userId } = tokenData;

        await getAmazonInventory(userId);

        console.log(`✅ Synced inventory for user ${userId}`);
      } catch (err) {
        console.error(`❌ Failed syncing for user ${tokenData.userId}`, err.message);
      }
    }
  });
}

export default startAmazonInventoryJob;