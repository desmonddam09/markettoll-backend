import jwt from 'jsonwebtoken';
import { userModel } from '../models/index.js';

const checkGuestOrUser = async (req, res, next) => {
  try {
    let token;
    let user;
    const { authorization } = req.headers;
    if (authorization) {
      token = authorization.split(' ')[1];
      if (token !== 'null') {
        const { _id } = jwt.verify(token, process.env.JWT_SECRET);
        user = await userModel.findById(_id);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    next({ ...err, status: 401 });
  }
};

export default checkGuestOrUser;
