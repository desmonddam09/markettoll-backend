import { addFundsAmountSchema, boostNameSchema, dateOfBirthSchema, idSchema, payoutFundsAmountSchema, stringSchema, stripeVerificationDocumentBack, stripeVerificationDocumentFront, subscriptionNameSchema } from "./schemas/index.js";

export const createConnectedAccount = async (req, res, next) => {
  try {
    const { bankDetails, dateOfBirth, idNumber } = req.body;
    await stringSchema('Account Holder Name').validate(bankDetails?.accountHolderName);
    await stringSchema('Account number').validate(bankDetails?.accountNumber);
    await stringSchema('Routing number').validate(bankDetails?.routingNumber);
    await dateOfBirthSchema('Date of birth').validate(dateOfBirth);
    await stringSchema('Id number').validate(idNumber);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateConnectedAccount = async (req, res, next) => {
  try {
    const front = req.files?.filter(t => t.fieldname === 'front');
    const back = req.files?.filter(t => t.fieldname === 'back');
    const { accountNumber, routingNumber } = req.body;

    if (!front?.length && !back?.length && !accountNumber && !routingNumber) {
      const error = new Error();
      error.name = 'ValidationError';
      error.message = 'Provide something to update.';
      throw error;
    }

    if (front?.length || back?.length) {
      await stripeVerificationDocumentFront('Verification document front').validate(front);
      await stripeVerificationDocumentBack('Verification document back').validate(back);
    }

    if (accountNumber || routingNumber) {
      await stringSchema('Account number').validate(accountNumber);
      await stringSchema('Routing number').validate(routingNumber);
    }

    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const connectedAccountIssues = async (req, res, next) => {
  next();
};

// export const deleteConnectedAccount = async (req, res, next) => {
//   next();
// };

export const createCustomerCard = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    await stringSchema('Payment method id').validate(paymentMethodId);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteCustomerCard = async (req, res, next) => {
  next();
};

export const addFundsToWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    await addFundsAmountSchema('Amount').validate(amount);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const payoutFromWallet = async (req, res, next) => {
  try {
    const { amount } = req.body;
    await payoutFundsAmountSchema('Amount').validate(amount);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const subscribePaidPlanStripe = async (req, res, next) => {
  try {
    const { subscriptionName } = req.body;
    await subscriptionNameSchema('Subscription name').validate(subscriptionName);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const unsubscribePaidPlanStripe = async (req, res, next) => {
  next();
};

// export const changeStripePaidPlan = async (req, res, next) => {
//   try {
//     const { subscriptionName } = req.body;
//     await subscriptionNameSchema('Subscription name').validate(subscriptionName);
//     next();
//   } catch (err) {
//     next({ ...err, status: 400 });
//   }
// };

export const productBoostPaidPlanStripe = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { boostName } = req.body;
    await idSchema('Product id').validate(_id);
    await boostNameSchema('Boost name').validate(boostName);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const serviceBoostPaidPlanStripe = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { boostName } = req.body;
    await idSchema('Service id').validate(_id);
    await boostNameSchema('Boost name').validate(boostName);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};
;
