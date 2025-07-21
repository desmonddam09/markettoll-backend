import { nextError } from "../utils/index.js";

const validateUserAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return nextError(next, 403, 'User is not an admin.');
  }
  next();
};

export default validateUserAdmin;
