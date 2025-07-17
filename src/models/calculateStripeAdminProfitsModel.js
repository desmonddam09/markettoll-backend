import mongoose from 'mongoose';

const calculateStripeAdminProfitsSchema = new mongoose.Schema(
  {
    paymentIntentId: {
      type: String,
      required: true,
      unique: true
    },
    transferAmount: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true
  }
);

calculateStripeAdminProfitsSchema.statics.addAdminProfit = async function (paymentIntentId, transferAmount) {
  const abc = new this({ paymentIntentId, transferAmount });
  await abc.save();
  return abc;
};

export default mongoose.model('calculateStripeAdminProfits', calculateStripeAdminProfitsSchema);
