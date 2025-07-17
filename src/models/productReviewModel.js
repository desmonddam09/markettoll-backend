import mongoose from 'mongoose';
import { productSchema } from './productModel.js';

const productReviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    orderProductPurchased: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'orderProductPurchased',
      required: true
    },
    product: {
      type: productSchema,
      default: () => ({})
    },
    rating: { type: Number, required: true },
    description: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

productReviewSchema.index({ reviewer: 1, orderProductPurchased: 1, 'product._id': 1 }, { unique: true });
productReviewSchema.index({ 'product._id': 1, rating: 1, createdAt: -1 });
productReviewSchema.index({ 'product._id': 1, createdAt: -1 });
productReviewSchema.index({ 'product.seller': 1, rating: 1, createdAt: -1 });
productReviewSchema.index({ 'product.seller': 1, createdAt: -1 });

productReviewSchema.statics.getReviewerReviews = async function (_id) {
  const reviews = await this.find({ reviewer: _id });
  return reviews;
};

productReviewSchema.statics.getProductReviews = async function (productId) {
  const limit = 5;
  const reviews = await this.find({ 'product._id': productId })
    .populate('reviewer')
    .sort({ createdAt: -1 })
    .limit(limit);

  return reviews;
};

productReviewSchema.statics.getAllProductReviews = async function (productId, page, rating) {
  const limit = 10;
  const skip = (page - 1) * limit;

  let query = {
    'product._id': productId,
  };

  if (rating != -1) {
    query = { ...query, rating };
  }

  const reviews = await this.find(query)
    .populate('reviewer')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return reviews;
};

productReviewSchema.statics.getSellerReviews = async function (sellerId) {
  const limit = 5;
  const reviews = await this.find({ 'product.seller': sellerId })
    .populate('reviewer')
    .sort({ createdAt: -1 })
    .limit(limit);

  return reviews;
};

productReviewSchema.statics.getAllSellerReviews = async function (sellerId, page, rating) {
  const limit = 10;
  const skip = (page - 1) * limit;

  let query = {
    'product.seller': sellerId,
  };

  if (rating != -1) {
    query = { ...query, rating };
  }

  const reviews = await this.find(query)
    .populate('reviewer')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return reviews;
};

export default mongoose.model('productReview', productReviewSchema);
