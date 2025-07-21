import mongoose from 'mongoose';

const reportedUserSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    type: {
      type: String,
      enum: ['chat', 'seller-profile'],
      required: true
    },
    selectedReason: {
      type: String,
      default: ''
    },
    otherReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

reportedUserSchema.statics.createReport = async function (reporter, reportedUser, type, selectedReason, otherReason) {
  const report = new this({ reporter, reportedUser, type, selectedReason, otherReason });
  await report.save();
  return report;
};

reportedUserSchema.statics.getReportedUsers = async function (page) {
  const limit = 100;
  const skip = (page - 1) * limit;

  const data = await this.find()
    .populate('reporter')
    .populate('reportedUser')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return data;
};

export default mongoose.model('reportedUser', reportedUserSchema);
