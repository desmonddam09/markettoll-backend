import express from 'express';
import { validateJWTAndValidateUser, validateUserStripeSetup, validateUserVerified } from '../accessControls/index.js';
import { stripeValidation } from '../validations/index.js';
import { stripeController } from '../controllers/index.js';

const router = express.Router();

//routes
router.post(
  '/connected-account',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.createConnectedAccount,
  stripeController.createConnectedAccount,
);

// stripe connected account setup
router.get(
  '/setup-stripe',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeController.setupStripeConnectedAccount,
);

router.put(
  '/connected-account',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.updateConnectedAccount,
  stripeController.updateConnectedAccount,
);

router.get(
  '/connected-account-issues',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.connectedAccountIssues,
  stripeController.connectedAccountIssues,
);

// router.delete(
//   '/connected-account',
//   validateJWTAndValidateUser,
//   validateUserVerified,
//   stripeValidation.deleteConnectedAccount,
//   stripeController.deleteConnectedAccount,
// );

router.post(
  '/customer-card',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.createCustomerCard,
  stripeController.createCustomerCard,
);

router.delete(
  '/customer-card',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.deleteCustomerCard,
  stripeController.deleteCustomerCard,
);

router.post(
  '/add-funds-to-wallet',
  validateJWTAndValidateUser,
  validateUserVerified,
  stripeValidation.addFundsToWallet,
  stripeController.addFundsToWallet,
);

router.post(
  '/payout-from-wallet',
  validateJWTAndValidateUser,
  validateUserVerified,
  validateUserStripeSetup,
  stripeValidation.payoutFromWallet,
  stripeController.payoutFromWallet,
);

router.post(
  '/subscribe-paid-plan-stripe',
  validateJWTAndValidateUser,
  stripeValidation.subscribePaidPlanStripe,
  stripeController.subscribePaidPlanStripe,
);

router.post(
  '/unsubscribe-paid-plan-stripe',
  validateJWTAndValidateUser,
  stripeValidation.unsubscribePaidPlanStripe,
  stripeController.unsubscribePaidPlanStripe,
);

// router.post(
//   '/change-paid-plan-stripe',
//   validateJWTAndValidateUser,
//   stripeValidation.changeStripePaidPlan,
//   stripeController.changeStripePaidPlan,
// );

router.post(
  '/product-boost-paid-plan-stripe/:_id',
  validateJWTAndValidateUser,
  stripeValidation.productBoostPaidPlanStripe,
  stripeController.productBoostPaidPlanStripe,
);

router.post(
  '/service-boost-paid-plan-stripe/:_id',
  validateJWTAndValidateUser,
  stripeValidation.serviceBoostPaidPlanStripe,
  stripeController.serviceBoostPaidPlanStripe,
);

export default router;
