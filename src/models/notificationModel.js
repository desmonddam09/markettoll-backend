import mongoose from 'mongoose';
import { attachmentSchema } from './schemas/index.js';

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['system-generated', 'user-generated'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    body: { type: String, required: true },
    viewedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ receiver: 1, updatedAt: -1 });
notificationSchema.index({ receiver: 1, viewedAt: 1 });

notificationSchema.statics.getUserNotifications = async function (userId, page) {
  const limit = 10;
  const skip = (page - 1) * limit;

  const unViewedCount = await this.find({ receiver: userId, viewedAt: null });
  const notifications = await this.find({ receiver: userId })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  return { notifications, unViewedCount: unViewedCount.length };
};

notificationSchema.statics.markAllUserNotificationsViewed = async function (userId) {
  const date = new Date();
  const result = await this.updateMany(
    { receiver: userId, viewedAt: null },
    { $set: { viewedAt: date } }
  );

  return result;
};

export default mongoose.model('notification', notificationSchema);
