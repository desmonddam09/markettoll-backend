import express from 'express';
import { createPayoutRequest, generateAffiliateLink, generateReferralLink, getInfluencerWallet, getMyAffiliates, getMyReferrals, getReferralAnalytics, myPayouts } from '../controllers/influencerController.js';
import { validateJWTAndValidateUser} from '../accessControls/index.js';


const router = express.Router();


router.post('/generate-referral-link', validateJWTAndValidateUser, generateReferralLink);
router.get('/analytics', validateJWTAndValidateUser, getReferralAnalytics);
router.get('/my-referrals', validateJWTAndValidateUser, getMyReferrals);
router.get('/my-wallet', validateJWTAndValidateUser,  getInfluencerWallet);
router.post('/payout-request', validateJWTAndValidateUser,  createPayoutRequest);
router.get('/my-payouts', validateJWTAndValidateUser, myPayouts);
router.post('/generate-affiliate-link', validateJWTAndValidateUser, generateAffiliateLink);
router.get('/my-affiliates', validateJWTAndValidateUser, getMyAffiliates);

export default router;
