import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';

const verifyEmailSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiry: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

verifyEmailSchema.index({ user: 1, email: 1 }, { unique: true });

verifyEmailSchema.statics.createOrUpdate = async function (_id, email, otp) {
  const expiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_TIME));
  const updatedDocument = await this.findOneAndUpdate(
    { user: _id, email },
    { otp, expiry },
    { new: true, upsert: true, }
  );

  return updatedDocument;
};

verifyEmailSchema.statics.verifyOTP = async function (_id, email, otp) {
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

  return document;
};


export default mongoose.model('verifyEmail', verifyEmailSchema);
