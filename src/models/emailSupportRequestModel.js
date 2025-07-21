import mongoose from 'mongoose';

const emailSupportRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'closed'],
      default: 'pending'
    },
    repliedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

emailSupportRequestSchema.index({ createdAt: -1 });

emailSupportRequestSchema.statics.createEmailSupportRequest = async function (userId, title, description) {
  const emailSupportRequest = this({
    user: userId,
    title,
    description,
    status: 'pending',
    repliedAt: null
  });

  await emailSupportRequest.save();

  return emailSupportRequest;
};

export default mongoose.model('emailSupportRequest', emailSupportRequestSchema);
