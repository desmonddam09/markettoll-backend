// cron/index.js

import cron from 'node-cron';
import { updateInfluencerStatus } from './updateInfluencerStatus.js';
import { checkAndMarkAffiliateGoals } from './checkAndMarkAffiliateGoals.js';




// Run every minute
cron.schedule('* * * * *', async () => {
  console.log("Running influencer status check...");
  await updateInfluencerStatus();
  await checkAndMarkAffiliateGoals();
});
