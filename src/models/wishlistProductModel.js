import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';
import { productPickupAddress } from '../helpers/index.js';

const wishlistProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    }
  },
  {
    timestamps: true
  }
);

wishlistProductSchema.index({ user: 1, product: 1 }, { unique: true });

wishlistProductSchema.statics.addUserWishlistProduct = async function (userId, productId) {
  const existingProduct = await this.findOne({ user: userId, product: productId });

  if (existingProduct) {
    throwError(409, 'Product already added to wishlist.');
  }

  const wishlistProduct = new this({
    user: userId,
    product: productId
  });

  await wishlistProduct.save();
  return wishlistProduct;
};

wishlistProductSchema.statics.deleteUserWishlistProduct = async function (userId, productId) {
  const deletedWishlistProduct = await this.findOneAndDelete({ user: userId, product: productId });
  if (!deletedWishlistProduct) {
    throwError(404, 'Product not found.');
  }
};

wishlistProductSchema.statics.getUserWishlistProductsAll = async function (userId) {
  const query = { user: userId };

  const wishlistProducts = await this.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'productDetails.seller',
        foreignField: '_id',
        as: 'productDetails.sellerDetails'
      }
    },
    {
      $unwind: '$productDetails.sellerDetails'
    },
    {
      $sort: { 'productDetails.name': 1 }
    },
  ]);

  const updatedWishlistProducts = wishlistProducts.map(it => {
    if (it.productDetails.fulfillmentMethod.selfPickup && !it.productDetails.pickupAddress) {
      it.productDetails.pickupAddress = productPickupAddress(it.productDetails.sellerDetails.pickupAddress);
    }
    return it;
  });

  return updatedWishlistProducts;
};

wishlistProductSchema.statics.getUserWishlistProducts = async function (userId, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const query = { user: userId };

  const wishlistProducts = await this.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'productDetails.seller',
        foreignField: '_id',
        as: 'productDetails.sellerDetails'
      }
    },
    {
      $unwind: '$productDetails.sellerDetails'
    },
    {
      $sort: { 'productDetails.name': 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
  ]);

  const updatedWishlistProducts = wishlistProducts.map(it => {
    if (it.productDetails.fulfillmentMethod.selfPickup && !it.productDetails.pickupAddress) {
      it.productDetails.pickupAddress = productPickupAddress(it.productDetails.sellerDetails.pickupAddress);
    }
    return it;
  });

  return updatedWishlistProducts;
};

wishlistProductSchema.statics.getUserSearchedWishlistProducts = async function (userId, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  const query = { user: userId };

  const wishlistProducts = await this.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $unwind: '$productDetails'
    },
    {
      $match: { 'productDetails.name': { $regex: nameRegex } }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'productDetails.seller',
        foreignField: '_id',
        as: 'productDetails.sellerDetails'
      }
    },
    {
      $unwind: '$productDetails.sellerDetails'
    },
    {
      $sort: { 'productDetails.name': 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
  ]);

  const updatedWishlistProducts = wishlistProducts.map(it => {
    if (it.productDetails.fulfillmentMethod.selfPickup && !it.productDetails.pickupAddress) {
      it.productDetails.pickupAddress = productPickupAddress(it.productDetails.sellerDetails.pickupAddress);
    }
    return it;
  });

  return updatedWishlistProducts;
};

export default mongoose.model('wishlistProduct', wishlistProductSchema);
