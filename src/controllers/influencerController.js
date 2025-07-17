import AffiliateReferral from "../models/affiliateReferralModel.js";
import influencerReferralModel from "../models/influencerReferralModel.js";
import InfluencerWallet from "../models/influencerWalletModel.js";
import PayoutRequest from "../models/payoutRequestModel.js";
import ReferralReward from "../models/ReferralRewardModel.js";
import ReferralRewardModel from "../models/ReferralRewardModel.js";
import userModel from "../models/userModel.js";
import createCustomer from "../stripe/createCustomer.js";
import { sendPayoutToInfluencer } from "../stripe/sendPayoutToInfluencer.js";
import { payoutRequestSchema } from "../validations/influencerValidation.js";





const generateReferralLink = async (req, res) => {
    try {
      const influencerId = req.user._id;
      const influencerName = req.user.name;
      // Dynamically set BASE_SIGNUP_URL based on NODE_ENV
    const BASE_SIGNUP_URL =
      process.env.NODE_ENV === 'production'
    ? 'https://www.markettoll.com/sign-up'
    : 'https://markettoll-affiliates.vercel.app/sign-up';

    const referralLink = `${BASE_SIGNUP_URL}?affiliate=${influencerName}&ref=${influencerId}`;
  
      const referral = await influencerReferralModel.findOneAndUpdate(
        { influencer: influencerId },
        {
          influencer: influencerId,
          referralLink,
          isActive: true,
          disabledBy: null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
  
      res.status(200).json({
        success: true,
        message: 'Referral link generated successfully!.',
        data: {
          
          referralLink: referral.referralLink,
        },
      });
    } catch (error) {  
        console.log("Error generating referral link:", error.message);
      res.status(500).json({
        success: false,
        message: 'Something went wrong.',
        error: error.message,
      });
    }
  };

  const getReferralAnalytics = async (req, res) => {
    try {
      const influencerId = req.user.id;
  
      // 1. Get all ReferralReward entries where influencer is current user
      const referralRewards = await ReferralRewardModel.find({ influencer: influencerId });
  
      // 2. Separate counts
      const totalTrackedUsers = referralRewards.length;
      const paidCount = referralRewards.filter(r => r.isSubscriptionPaid).length;
      const unpaidCount = totalTrackedUsers - paidCount;
  
      // 3. Total commission from paid ones
      const totalCommission = referralRewards
        .filter(r => r.isSubscriptionPaid)
        .reduce((sum, r) => sum + (r.referralAmount || 0), 0);
  
      // 4. Conversion Rate
      const conversionRate = totalTrackedUsers === 0
        ? 0
        : ((paidCount / totalTrackedUsers) * 100).toFixed(2);

       // Get all approved payout requests and sum them
      const approvedPayouts = await PayoutRequest.find({
        influencer: influencerId,
        status: 'approved'
      });

    const totalPayouts = approvedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
  
      res.status(200).json({
        success: true,
        data: {
          totalReferrals: paidCount,
          // paidCount,
          // unpaidCount,
          conversionRate: Number(conversionRate),
          totalCommission,
          totalPayouts,
        },
      });
    } catch (err) {
      console.error('Error in getReferralAnalytics:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  const getMyReferrals = async (req, res) => {
    try {
      const influencerId = req.user.id;

       if (!req.user.stripeCustomer.id) {
        console.log("check user=== req.user.stripeCustomer.id", req.user.stripeCustomer.id);
        
          const customerData  = await createCustomer(req.user.name, req.user.email.value); 

          if (customerData && customerData.id) {
            // Update the user with the new Stripe customer ID
            await userModel.findByIdAndUpdate(
              influencerId,
              {
                "stripeCustomer.id": customerData.id,
              },
              { new: true }
            );
          }
       }
  
      // Find all referral records where the user is the influencer
      const referrals = await ReferralReward.find({ influencer: influencerId })
        .populate('referredUser', 'name email.value')
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        success: true,
        message: 'Referrals fetched successfully',
        data: referrals
      });
    } catch (err) {
      console.error('Error fetching referrals:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch referral data',
        error: err.message
      });
    }
  };

  const getInfluencerWallet = async (req, res) => {
    try {
      // Try to find the wallet by influencer ID
      let wallet = await InfluencerWallet.findOne({ influencer: req.user.id });
  
      // If wallet doesn't exist, create one with default amount = 0
      if (!wallet) {
        wallet = new InfluencerWallet({
          influencer: req.user.id,
          amount: 0
        });
  
        await wallet.save();
      }
  
      return res.status(200).json({
        success: true,
        message: 'Wallet fetched successfully',
        data: wallet
      });
  
    } catch (error) {
      console.error('Error fetching influencer wallet:', error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while fetching wallet',
        error: error.message
      });
    }
  };

  const createPayoutRequest = async (req, res) => {
  try {
    const { error, value } = payoutRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { amount } = value;
    const influencerId = req.user.id;

    if (!req.user.stripeConnectedAccount?.id) {
      return res.status(400).json({
        success: false,
        message: "User connected account setup is not complete.",
      });
    }

    const wallet = await InfluencerWallet.findOne({ influencer: influencerId });

    if (!wallet || wallet.amount < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance for this payout request',
      });
    }

    // Attempt to send payout directly
    const payoutResult = await sendPayoutToInfluencer(
      req.user.stripeConnectedAccount.id,
      amount,
      influencerId
    );

    if (!payoutResult.success) {
      return res.status(400).json({
        success: false,
        message: `Payout failed: ${payoutResult.message}`
      });
    }

    // Deduct the amount from influencer's wallet
    wallet.amount -= amount;
    await wallet.save();

    // Save payout request with approved status
    const payout = new PayoutRequest({
      influencer: influencerId,
      amount,
      status: 'approved',
    });

    await payout.save();

    return res.status(200).json({
      success: true,
      message: 'Payout processed and request saved successfully',
      data: payout,
    });

  } catch (error) {
    console.error('Error creating payout request:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while creating payout request',
      error: error.message,
    });
  }
};
  
  const myPayouts = async (req, res) => {
    try {
      const influencerId = req.user.id;
  
      const payouts = await PayoutRequest.find({ influencer: influencerId }).select('-influencer').sort({ createdAt: -1 });
  
      return res.status(200).json({
        success: true,
        message: 'Payout requests fetched successfully',
        data: payouts
      });
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while fetching payouts',
        error: error.message
      });
    }
  };
  
  const generateAffiliateLink = async (req, res) => {
  try {
    const influencerId = req.user._id;
    const influencerName = req.user.name;

    // Dynamically set BASE_SIGNUP_URL based on NODE_ENV
    const BASE_SIGNUP_URL =
      process.env.NODE_ENV === "production"
        ? "https://www.markettoll.com/sign-up"
        : "https://markettoll-affiliates.vercel.app/sign-up";

    // Notice `type=affiliate` added to distinguish this as affiliate link
    const referralLink = `${BASE_SIGNUP_URL}?type=affiliate&affiliate=${influencerName}&ref=${influencerId}`;

    const referral = await AffiliateReferral.findOneAndUpdate(
      { influencer: influencerId },
      {
        influencer: influencerId,
        referralLink,
        isActive: true,
        disabledBy: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Affiliate referral link generated successfully!",
      data: {
        referralLink: referral.referralLink,
      },
    });
  } catch (error) {
    console.log("Error generating affiliate referral link:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

const getMyAffiliates = async (req, res) => {
  try {
    const influencerId = req.user._id;
    

    const affiliates = await userModel.find({
      influencerRef: influencerId,
      role: 'influencer',
    })

    res.status(200).json({
      success: true,
      message: 'Affiliates fetched successfully.',
      data: affiliates,
    });
  } catch (error) {
    console.log('Error fetching affiliates:', error.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong.',
      error: error.message,
    });
  }
};


 export {
   generateReferralLink,
   getReferralAnalytics,
   getInfluencerWallet,
   createPayoutRequest,
   myPayouts,
   getMyReferrals,
   generateAffiliateLink,
   getMyAffiliates,
 }; 