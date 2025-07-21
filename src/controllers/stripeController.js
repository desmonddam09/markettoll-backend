import { userModel } from "../models/index.js";
import { stripe } from "../stripe/index.js";

export const createConnectedAccount = async (req, res, next) => {
  try {
    const { bankDetails, dateOfBirth, idNumber } = req.body;
    const data = await userModel.createStripeConnectedAccount(req.user._id, req.headers['x-real-ip'], bankDetails, dateOfBirth, idNumber);
    res.status(201).json({
      success: true,
      message: 'Stripe connected account created successfully.',
      data: data.stripeConnectedAccount
    });
  } catch (err) {
    next(err);
  }
};

export const setupStripeConnectedAccount = async (req, res) => {
  try {
    const { stripeConnectedAccount, _id } = req.user;

    const REFRESH_URL = 'https://example.com/';
    const RETURN_URL = 'https://example.com/';
    let accountLink;

    if (stripeConnectedAccount.id) {
      // If account already exists, create onboarding link
      accountLink = await stripe.accountLinks.create({
        account: stripeConnectedAccount.id,
        refresh_url: REFRESH_URL,
        return_url: RETURN_URL,
        type: 'account_onboarding',
      });
    } else {
      // Create new Stripe account
      const newAccount = await stripe.accounts.create({
        country: 'US',
        type: 'custom',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: { interval: 'manual' },
          },
        },
      });

      // Create onboarding link for the new account
      accountLink = await stripe.accountLinks.create({
        account: newAccount.id,
        refresh_url: REFRESH_URL,
        return_url: RETURN_URL,
        type: 'account_onboarding',
      });

      // Update user document with stripe_account_id
      await userModel.findByIdAndUpdate(
        _id,
       {
      $set: {
        'stripeConnectedAccount.id': newAccount.id,
      },
    },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Stripe onboarding link generated successfully",
      data: accountLink,
    });

  } catch (error) {
    console.error('Stripe account setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

export const updateConnectedAccount = async (req, res, next) => {
  try {
    const front = req.files?.filter(t => t.fieldname === 'front');
    const back = req.files?.filter(t => t.fieldname === 'back');
    const { accountNumber, routingNumber } = req.body;

    const data = await userModel.updateStripeConnectedAccount(req.user._id, { front: front[0], back: back[0] }, { accountNumber, routingNumber });
    res.status(201).json({
      success: true,
      message: 'Stripe connected account bank details updated successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const connectedAccountIssues = async (req, res, next) => {
  try {
    const data = await userModel.connectedAccountIssues(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Connected account issues retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

// export const deleteConnectedAccount = async (req, res, next) => {
//   try {
//     const data = await userModel.deleteConnectedAccount(req.user._id);
//     res.status(200).json({
//       success: true,
//       message: 'Connected account deleted successfully.',
//       data: data
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const createCustomerCard = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    const data = await userModel.stripeCreateCustomerCard(req.user._id, paymentMethodId);
    res.status(200).json({
      success: true,
      message: 'Stripe customer card added successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomerCard = async (req, res, next) => {
  try {
    const data = await userModel.deleteCustomerCard(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Stripe customer card deleted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const addFundsToWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const data = await userModel.addFundsToWallet(req.user._id, amount);
    res.status(201).json({
      success: true,
      message: 'Funds added to your wallet.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const payoutFromWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const data = await userModel.payoutFromWallet(req.user._id, amount);
    res.status(201).json({
      success: true,
      message: 'Amount payout successful.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const subscribePaidPlanStripe = async (req, res, next) => {
  try {
    const { subscriptionName } = req.body;
    const data = await userModel.subscribePaidPlanStripe(req.user._id, subscriptionName);
    res.status(201).json({
      success: true,
      message: 'User subscribed successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const unsubscribePaidPlanStripe = async (req, res, next) => {
  try {
    await userModel.unsubscribePaidPlanStripe(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User unsubscribed successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// export const changeStripePaidPlan = async (req, res, next) => {
//   try {
//     const { subscriptionName } = req.body;
//     const data = await userModel.changeStripePaidPlan(req.user._id, subscriptionName);
//     res.status(201).json({
//       success: true,
//       message: 'Subscription plan changed successfully.',
//       data: data
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const productBoostPaidPlanStripe = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { boostName } = req.body;
    const data = await userModel.productBoostPaidPlanStripe(req.user._id, _id, boostName);
    res.status(201).json({
      success: true,
      message: 'Product boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const serviceBoostPaidPlanStripe = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { boostName } = req.body;
    const data = await userModel.serviceBoostPaidPlanStripe(req.user._id, _id, boostName);
    res.status(201).json({
      success: true,
      message: 'Service boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};
