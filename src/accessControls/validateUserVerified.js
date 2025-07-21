import { nextError } from "../utils/index.js";

const validateUserVerified = async (req, res, next) => {
  if (!req.user.email.value || !req.user.email.verified) {
    return nextError(next, 403, 'User email is not verified.');
  }
  // if (!req.user.phoneNumber.code || !req.user.phoneNumber.value || !req.user.phoneNumber.verified) {
  //   return nextError(next, 403, 'User phone number is not verified.');
  // }
  // if (!req.user.identityVerified) {
  //   return nextError(next, 403, 'User identity is not verified.');
  // }
  next();
};

export default validateUserVerified;
