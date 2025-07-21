import mongoose from 'mongoose';

const avgProductRatingSchema = new mongoose.Schema(
  {
    oneStar: { type: Number, default: 0 },
    twoStar: { type: Number, default: 0 },
    threeStar: { type: Number, default: 0 },
    fourStar: { type: Number, default: 0 },
    fiveStar: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default avgProductRatingSchema;
