import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';

const wishlistServiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'service',
      required: true,
    }
  },
  {
    timestamps: true
  }
);

wishlistServiceSchema.index({ user: 1, service: 1 }, { unique: true });

wishlistServiceSchema.statics.addUserWishlistService = async function (userId, serviceId) {
  const existingService = await this.findOne({ user: userId, service: serviceId });

  if (existingService) {
    throwError(409, 'Service already added to wishlist.');
  }

  const wishlistService = new this({
    user: userId,
    service: serviceId
  });

  await wishlistService.save();
  return wishlistService;
};

wishlistServiceSchema.statics.deleteUserWishlistService = async function (userId, serviceId) {
  const deletedWishlistService = await this.findOneAndDelete({ user: userId, service: serviceId });
  if (!deletedWishlistService) {
    throwError(404, 'Service not found.');
  }
};

wishlistServiceSchema.statics.getUserWishlistServicesAll = async function (userId) {
  const query = { user: userId };

  const wishlistServices = await this.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    {
      $unwind: '$serviceDetails'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'serviceDetails.seller',
        foreignField: '_id',
        as: 'serviceDetails.sellerDetails'
      }
    },
    {
      $unwind: '$serviceDetails.sellerDetails'
    },
    {
      $sort: { 'serviceDetails.name': 1 }
    },
  ]);

  return wishlistServices;
};

wishlistServiceSchema.statics.getUserWishlistServices = async function (userId, page) {

  const limit = 20;
  const skip = (page - 1) * limit;
  const query = { user: userId };

  const wishlistServices = await this.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    {
      $unwind: '$serviceDetails'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'serviceDetails.seller',
        foreignField: '_id',
        as: 'serviceDetails.sellerDetails'
      }
    },
    {
      $unwind: '$serviceDetails.sellerDetails'
    },
    {
      $sort: { 'serviceDetails.name': 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
  ]);

  return wishlistServices;
};

wishlistServiceSchema.statics.getUserSearchedWishlistServices = async function (userId, name, page) {
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
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    {
      $unwind: '$serviceDetails'
    },
    {
      $match: { 'serviceDetails.name': { $regex: nameRegex } }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'serviceDetails.seller',
        foreignField: '_id',
        as: 'serviceDetails.sellerDetails'
      }
    },
    {
      $unwind: '$serviceDetails.sellerDetails'
    },
    {
      $sort: { 'serviceDetails.name': 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
  ]);

  return wishlistProducts;
};

export default mongoose.model('wishlistService', wishlistServiceSchema);
