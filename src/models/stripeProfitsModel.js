import mongoose from 'mongoose';

const stripeProfitsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: true
  }
);

stripeProfitsSchema.statics.addAdminProfit = async function (profit) {
  const adminProfits = await this.findOneAndUpdate(
    {
      type: 'adminProfits'
    },
    {
      $inc: { value: profit }
    },
    { new: true, upsert: true }
  );
  return adminProfits;
};

export default mongoose.model('stripeProfits', stripeProfitsSchema);
