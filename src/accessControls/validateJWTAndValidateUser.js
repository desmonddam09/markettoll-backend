import jwt from 'jsonwebtoken';
import { userModel } from '../models/index.js';
import { nextError } from '../utils/index.js';

const validateJWTAndValidateUser = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return nextError(next, 401, 'Authorization token is required.');
    }

    const token = authorization.split(' ')[1];

    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(_id);

    if (!user) {
      return nextError(next, 404, 'User does not exist.');
    }
    if (user.status === 'deleted') {
      return nextError(next, 403, 'Your account has been deleted.');
    }
    req.user = user;
    next();
  } catch (err) {
    next({ ...err, status: 401 });
  }
};

export default validateJWTAndValidateUser;
