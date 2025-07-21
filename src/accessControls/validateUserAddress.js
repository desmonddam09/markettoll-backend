import { nextError } from "../utils/index.js";

const validateUserAddress = async (req, res, next) => {
  if (!req.user.address.country || !req.user.address.state || !req.user.address.city) {
    return nextError(next, 403, 'User address is not set.');
  }
  next();
};

export default validateUserAddress;
