import crypto from 'crypto';

const generateOTP = (digits) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  const otp = crypto.randomInt(min, max);
  return otp.toString();
};

export default generateOTP;
