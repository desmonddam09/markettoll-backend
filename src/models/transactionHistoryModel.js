import mongoose from 'mongoose';

const transactionHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
  },
  {
    timestamps: true
  }
);

transactionHistorySchema.index({ user: 1, createdAt: -1 });

transactionHistorySchema.statics.getUserTransactionHistory = async function (userId, page) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const transactionHistory = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return transactionHistory;
};


export default mongoose.model('transactionHistory', transactionHistorySchema);
