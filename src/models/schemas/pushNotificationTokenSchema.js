import mongoose from 'mongoose';

const pushNotificationTokenSchema = new mongoose.Schema(
  {
    platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
    token: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default pushNotificationTokenSchema;
