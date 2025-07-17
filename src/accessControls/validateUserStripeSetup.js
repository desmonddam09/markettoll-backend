import { nextError } from "../utils/index.js";

const validateUserStripeSetup = async (req, res, next) => {
  if (!req.user.stripeConnectedAccount.id) {
    return nextError(next, 403, 'Please add a bank account to proceed further.');
  }
  next();
};

export default validateUserStripeSetup;
