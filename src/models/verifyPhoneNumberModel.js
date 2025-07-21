import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';

const verifyPhoneNumberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    phoneNumber: {
      code: { type: String, required: true },
      value: { type: String, required: true }
    },
    otp: { type: String, required: true },
    expiry: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

verifyPhoneNumberSchema.index({ user: 1, 'phoneNumber.code': 1, 'phoneNumber.value': 1 }, { unique: true });

verifyPhoneNumberSchema.statics.createOrUpdate = async function (_id, phoneNumber, otp) {
  const expiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_TIME));
  const updatedDocument = await this.findOneAndUpdate(
    { user: _id, 'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value },
    { otp, expiry },
    { new: true, upsert: true, }
  );

  return updatedDocument;
};

verifyPhoneNumberSchema.statics.verifyOTP = async function (_id, phoneNumber, otp) {
  const document = await this.findOne({ user: _id, 'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value });

  if (!document) {
    throwError(404, 'No OTP generated for user with this phone number.');
  }

  if (document.otp != otp) {
    throwError(400, 'Invalid OTP.');
  }

  if (document.expiry < new Date()) {
    throwError(400, 'OTP has expired.');
  }

  return document;
};


export default mongoose.model('verifyPhoneNumber', verifyPhoneNumberSchema);
