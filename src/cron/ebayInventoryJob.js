import cron from 'node-cron';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { getUserInventory } from '../controllers/ebayController.js';

const startEbayInventoryJob = () => {
  // Run every 12 hours (you can change the schedule)
  cron.schedule('0 */12 * * *', async () => {
    console.log('⏰ Running eBay inventory sync job...');

    const tokens = await EbayTokenModel.find({});
    for (const tokenData of tokens) {
      try {
        const { userId } = tokenData;

        await getUserInventory(userId);

        console.log(`✅ Synced inventory for user ${userId}`);
      } catch (err) {
        console.error(`❌ Failed syncing for user ${tokenData.userId}`, err.message);
      }
    }
  });
}

export default startEbayInventoryJob;