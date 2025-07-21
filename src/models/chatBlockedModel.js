import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';

const chatBlockedSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    blockedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  },
  {
    timestamps: true
  }
);

chatBlockedSchema.index({ blocker: 1, blockedUser: 1 }, { unique: true });

chatBlockedSchema.statics.blockUser = async function (blocker, blockedUser) {
  if (blocker.equals(blockedUser)) {
    throwError(409, 'User cannot block himself');
  }
  const alreadyBlocked = await this.findOne({ blocker, blockedUser });

  if (alreadyBlocked) {
    throwError(409, 'User already blocked this user');
  }

  const chatBlocked = new this({
    blocker,
    blockedUser
  });

  await chatBlocked.save();

  return chatBlocked;
};

export default mongoose.model('chatBlocked', chatBlockedSchema);
