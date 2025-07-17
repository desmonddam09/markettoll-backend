import jwt from 'jsonwebtoken';

const createJWT = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET);
};

export default createJWT;
