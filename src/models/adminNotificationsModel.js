import mongoose from "mongoose";
import { attachmentSchema } from "./schemas/index.js";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['instant', 'schedule'], required: true },
    title: { type: String, required: true },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    body: { type: String, required: true },
    scheduleDate: { type: Date, required: true },
    sentDate: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

adminNotificationSchema.index({ scheduleDate: -1 });

adminNotificationSchema.statics.addNotification = async function (type, title, attachments, body, scheduleDate, sentDate) {
  const notification = new this({
    type,
    title,
    attachments,
    body,
    scheduleDate,
    sentDate
  });
  await notification.save();
  return notification;
};

adminNotificationSchema.statics.getAll = async function (page) {
  const limit = 100;
  const skip = (page - 1) * limit;

  const notifications = await this.find()
    .sort({ scheduleDate: -1 })
    .skip(skip)
    .limit(limit);

  return notifications;
};

export default mongoose.model('adminNotification', adminNotificationSchema);
