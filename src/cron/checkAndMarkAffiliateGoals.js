import AchievedAffiliateGoal from '../models/achievedAffiliateGoalsModel.js';
import AffiliateGoal from '../models/affiliateGoalModel.js';
import userModel from '../models/userModel.js';

export const checkAndMarkAffiliateGoals = async () => {
  try {
    console.log('Affiliate Achievement Cron Job Started');

    // Fetch all users with role "influencer"
    const influencers = await userModel.find({ role: 'influencer' }, '_id influencerRate');

    if (!influencers.length) {
      console.log('No influencers found.');
      return;
    }

    // Get the affiliate goal (assuming only one global goal exists)
    const affiliateGoal = await AffiliateGoal.findOne();
    if (!affiliateGoal) {
      console.log('Affiliate goal not defined.');
      return;
    }

    for (const influencer of influencers) {
      const influencerId = influencer._id;

      // Count how many influencers this user has referred who also became influencers
      const referredInfluencersCount = await userModel.countDocuments({
        influencerRef: influencerId,
        role: 'influencer',
      });

      // Check if goal achieved
      if (referredInfluencersCount >= affiliateGoal.totalReferrals) {
        
        // Check if already marked as achieved
        const alreadyAchieved = await AchievedAffiliateGoal.findOne({
          affiliate: influencerId,
        });

        if (!alreadyAchieved) {
          // Create achievement record
          await AchievedAffiliateGoal.create({
            affiliate: influencerId,
            currentInfluencerRate: influencer.influencerRate,
            additionalRate: affiliateGoal.influencerRate,
          });

          // Update user's influencerRate
          await userModel.findByIdAndUpdate(influencerId, {
            $inc: { influencerRate: affiliateGoal.influencerRate },
          });

           console.log(`Goal achieved for influencer ${influencerId}, influencerRate updated.`);
        }
      }
    }

    console.log('Affiliate Achievement Cron Job Completed');
  } catch (error) {
    console.error('Error in Affiliate Achievement Cron Job:', error.message);
  }
};
