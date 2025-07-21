import express from 'express';
import { validateJWTAndValidateUser, validateUserVerified, validateUserAdmin } from '../accessControls/index.js';
import { adminValidation } from '../validations/index.js';
import { adminController } from '../controllers/index.js';
import { approveAffiliateRequest, createInfluencerGoal, getAffiliateGoal, getAffiliateStats, getAllInfluencers, getAllPayoutRequests, getGoalAchievers, getInfluencerGoal, getInfluencerRateSettings, getInfluencerSettings, getPendingAffiliateRequests, getReferredUsers, handlePayoutRequest, toggleReferralStatus, updateAffiliateGoal, updateAllInfluencerRates, updateInfluencerGoal, updateInfluencerRate, updateInfluencerRateSettings, updateInfluencerSettings } from '../controllers/adminController.js';

const router = express.Router();

//routes
router.post(
  '/email-password-login',
  adminValidation.emailPasswordLogIn,
  adminController.emailPasswordLogIn,
);

router.get(
  '/reported-users',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getReportedUsers,
  adminController.getReportedUsers
);

router.get(
  '/orders',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getOrders,
  adminController.getOrders,
);

router.post(
  '/notification',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.notification,
  adminController.notification,
);

router.get(
  '/notification',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getNotification,
  adminController.getNotification,
);

router.get(
  '/deleted-accounts',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getDeletedAccounts,
  adminController.getDeletedAccounts,
);

router.get(
  '/products',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getProducts,
  adminController.getProducts,
);

router.get(
  '/pending-review-products',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getPendingReviewProducts,
  adminController.getPendingReviewProducts,
);
router.post(
  '/manual-moderate-products',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminController.moderateProducts,
);
router.get(
  '/pending-review-services',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getPendingReviewServices,
  adminController.getPendingReviewServices,
);
router.post(
  '/manual-moderate-services',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminController.moderateServices,
);
router.get(
  '/deactivated-products',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getDeactivatedProducts,
  adminController.getDeactivatedProducts,
);

router.get(
  '/services',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getServices,
  adminController.getServices,
);

router.post(
  '/block-user/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.blockUser,
  adminController.blockUser,
);

router.post(
  '/unblock-user/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.unblockUser,
  adminController.unblockUser,
);

router.post(
  '/category',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.addCategory,
  adminController.addCategory,
);

router.post(
  '/subcategory',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.addSubcategory,
  adminController.addSubcategory,
);

router.post(
  '/payout-profits',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.createPayoutProfits,
  adminController.createPayoutProfits,
);

router.get(
  '/users',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.getUsers,
  adminController.getUsers,
);

router.post(
  '/email-support-request-reply/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.emailSupportReply,
  adminController.emailSupportReply,
);

router.post(
  '/email-support-request-close-ticket/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.emailSupportCloseTicket,
  adminController.emailSupportCloseTicket,
);

router.get(
  '/active-subscriptions',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.activeSubscriptions,
  adminController.activeSubscriptions,
);

router.get(
  '/active-boosts',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.activeBoosts,
  adminController.activeBoosts,
);

router.get(
  '/yearly-orders',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.yearlyOrders,
  adminController.yearlyOrders,
);

router.get(
  '/yearly-subscription-revenue',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.yearlySubscriptionRevenue,
  adminController.yearlySubscriptionRevenue,
);

router.get(
  '/email-support-request',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.emailSupportRequest,
  adminController.emailSupportRequest,
);

router.get(
  '/blocked-users',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.blockedUsers,
  adminController.blockedUsers,
);

router.post(
  '/deactivate-product/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.deactivateProduct,
  adminController.deactivateProduct,
);

router.post(
  '/activate-product/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.activateProduct,
  adminController.activateProduct,
);

router.get(
  '/product-reviews/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.productReviews,
  adminController.productReviews,
);

router.get(
  '/product-orders/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.productOrders,
  adminController.productOrders,
);

router.get(
  '/user-orders/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userOrders,
  adminController.userOrders,
);

router.get(
  '/user-subscriptions/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userSubscriptions,
  adminController.userSubscriptions,
);

router.get(
  '/user-listings/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userListings,
  adminController.userListings,
);

router.get(
  '/user-listings-boosted/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userListingsBoosted,
  adminController.userListingsBoosted,
);

router.get(
  '/user-reviews/:_id',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userReviews,
  adminController.userReviews,
);

router.get(
  '/users-registered-in-month',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.usersRegisteredInMonth,
  adminController.usersRegisteredInMonth,
);

router.get(
  '/user-subscriptions-in-month',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserAdmin,
  adminValidation.userSubscriptionsInMonth,
  adminController.userSubscriptionsInMonth,
);

router.get('/influencer-settings', validateJWTAndValidateUser, getInfluencerSettings);
router.put('/update-influencer-settings', validateJWTAndValidateUser, updateInfluencerSettings);
router.get('/get-influencers', validateJWTAndValidateUser, getAllInfluencers);
router.post('/toggle-referral-status', validateJWTAndValidateUser, toggleReferralStatus);
router.get('/influencers-stats', validateJWTAndValidateUser, getAffiliateStats);
router.get('/pending-influencers-requests', validateJWTAndValidateUser, getPendingAffiliateRequests);
router.put('/approve-influencer-request', validateJWTAndValidateUser, approveAffiliateRequest);
router.put('/update-influencer-rate', validateJWTAndValidateUser, updateInfluencerRate);
router.put('/update-all-influencer-rates', validateJWTAndValidateUser, updateAllInfluencerRates);
router.get('/all-payout-requests', validateJWTAndValidateUser, getAllPayoutRequests);
router.post('/handle-payout-requests', validateJWTAndValidateUser, handlePayoutRequest);
router.post('/create-influencer-goal', validateJWTAndValidateUser, createInfluencerGoal);
router.get('/influencer-goal', validateJWTAndValidateUser, getInfluencerGoal);
router.get('/goal-achievers',validateJWTAndValidateUser,  getGoalAchievers);
router.put('/influencer-goal/:id', validateJWTAndValidateUser, updateInfluencerGoal);
router.get('/get-influencers/:influencerId', validateJWTAndValidateUser, getReferredUsers);
router.get('/rate-settings', validateJWTAndValidateUser, getInfluencerRateSettings);
router.put('/update-rate-settings', validateJWTAndValidateUser, updateInfluencerRateSettings);

//Affiliate reference
router.get('/affiliate-goal', validateJWTAndValidateUser, getAffiliateGoal);
router.put('/update-affiliate-goal', validateJWTAndValidateUser, updateAffiliateGoal);

export default router;
