// jobs/updateInfluencerStatus.js


import InfluencerGoal from '../models/influencerGoalModel.js';
import InfluencerSettings from '../models/influencerSettingsModel.js';
import userModel from '../models/userModel.js';


export const updateInfluencerStatus = async () => {
  try {
    // Check if influencer setting is set to "auto"
    const settings = await InfluencerSettings.findOne();
    if (!settings || settings.influencerStatus !== 'auto') {
        console.log("InfluencerSetting==", settings?.influencerStatus);
        
      return;
    }

    // Get latest influencer goal
    const goal = await InfluencerGoal.findOne().sort({ createdAt: -1 });
    if (!goal) {
      console.log("No goal found.");
      return;
    }

    const { totalReferrals, influencerRate } = goal;
    console.log("totalReferrals, influencerRate",  totalReferrals, influencerRate);
    

    // Find influencers who meet or exceed the referral goal
    const influencers = await userModel.aggregate([
          {
            $match: {
              role: 'influencer'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: 'influencerRef',
              as: 'referredUsers'
            }
          },
          {
            $addFields: {
              referredCount: { $size: '$referredUsers' }
            }
          },
          {
            $match: {
              referredCount: { $gte: totalReferrals }
            }
          },
          {
            $project: {
              password: 0,
              referredUsers: 0
            }
          }
        ]);

    

    const influencerIds = influencers.map(i => i._id);

    if (influencerIds.length === 0) {
      console.log("No influencers met the referral goal.");
      return;
    }

    // Update eligible influencers
    const result = await userModel.updateMany(
      { _id: { $in: influencerIds } },
      {
        $set: {
          influencerRate: influencerRate
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} influencer(s) to active.`);

  } catch (error) {
    console.error("Error updating influencer statuses:", error);
  }
};
