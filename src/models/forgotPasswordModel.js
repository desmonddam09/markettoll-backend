import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';

const forgotPasswordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiry: { type: Date, required: true },
    verified: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

forgotPasswordSchema.index({ user: 1, email: 1 }, { unique: true });

forgotPasswordSchema.statics.createOrUpdate = async function (_id, email, otp) {
  const expiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_TIME));
  const updatedDocument = await this.findOneAndUpdate(
    { user: _id, email },
    { otp, expiry, verified: false },
    { new: true, upsert: true, }
  );

  return updatedDocument;
};

forgotPasswordSchema.statics.verifyOTP = async function (_id, email, otp) {
  const document = await this.findOne({ user: _id, email });

  if (!document) {
    throwError(404, 'No OTP generated for user with this email.');
  }

  if (document.otp != otp) {
    throwError(400, 'Invalid OTP.');
  }

  if (document.expiry < new Date()) {
    throwError(400, 'OTP has expired.');
  }

  if (document.verified) {
    throwError(409, 'OTP already verified.');
  }

  document.verified = true;
  await document.save();

  return document;
};

export default mongoose.model('forgotPassword', forgotPasswordSchema);
