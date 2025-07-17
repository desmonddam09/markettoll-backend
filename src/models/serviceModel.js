import mongoose from 'mongoose';
import { v4 } from 'uuid';
import userModel from './userModel.js';
import { saveFile, throwError } from '../utils/index.js';
import { imagesSchema, serviceBoostPlanSchema } from './schemas/index.js';
import homeScreenSearchServiceHistoryModel from './homeScreenSearchServiceHistoryModel.js';
import wishlistServiceModel from './wishlistServiceModel.js';

const serviceSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    images: { type: [imagesSchema], default: [] },
    name: { type: String, required: true },
    description: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    boostPlan: { type: serviceBoostPlanSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
    adminStatus: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'rejected', 'pending_review'],
      default: 'pending_review',
    },
    moderationReason: { type: String, default: '' },
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ _id: 1, seller: 1, status: 1 });
serviceSchema.index({ seller: 1, status: 1 });
serviceSchema.index({ name: 'text' });

//authorized routes
serviceSchema.statics.addUserService = async function (
  userId,
  images,
  displayImageIndex,
  name,
  description,
  country,
  state,
  city,
  price,
  moderationStatus = 'pending_review',
  moderationReason = ''
) {
  const service = new this({
    seller: userId,
    name,
    description,
    country,
    state,
    city,
    price,
    moderationStatus,
    moderationReason
  });

  const imagesPromises = images.map((item, index) => saveFile(`services/${service._id}/images/${v4()}`, item));

  const imagesResults = await Promise.allSettled(imagesPromises);

  for (const x of imagesResults) {
    if (x.status !== 'fulfilled') {
      throwError(400, 'Images could not be uploaded successfully.');
    }
  }

  for (let i = 0; i < imagesResults.length; i++) {
    service.images.push({ url: imagesResults[i].value, displayImage: displayImageIndex == i });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await userModel.findById(userId).session(session);
    if (user.subscriptionPlan.availablePostings <= 0) {
      throwError(409, 'you do not have any postings available.');
    }
    user.subscriptionPlan.availablePostings -= 1;
    await user.save({ session });
    await service.save({ session });

    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }

  return service;
};

// serviceSchema.statics.updateUserService = async function (userId, _id, newImages, parsedCurrentImages, displayImageIndex, name, description, country, state, city, price) {
//   const service = await this.findOne(
//     { _id: _id, seller: userId, status: { $ne: 'deleted' } }
//   );

//   if (!service) {
//     throwError(404, 'User does not have this service or this service is deleted.');
//   }

//   if (!displayImageIndex || displayImageIndex == '') {
//     const matchingURLS = service.images.filter(it => parsedCurrentImages.includes(it.url));
//     const hasDisplayImage = matchingURLS.some(it => it.displayImage);

//     if (!hasDisplayImage) {
//       throwError(409, "Display image is not defined.");
//     }
//   }

//   let imagesResults = null;

//   if (newImages?.length > 0) {
//     const imagesPromises = newImages.map((item, index) => saveFile(`services/${service._id}/images/${v4()}`, item));

//     imagesResults = await Promise.allSettled(imagesPromises);

//     for (const x of imagesResults) {
//       if (x.status !== 'fulfilled') {
//         throwError(400, 'Images could not be uploaded successfully.');
//       }
//     }
//   }

//   service.images = service.images.filter(it => parsedCurrentImages.includes(it.url));

//   if (!displayImageIndex || displayImageIndex == '') {
//     if (imagesResults) {
//       for (const x of imagesResults) {
//         service.images.push({ url: x.value, displayImage: false });
//       }
//     }
//   } else {
//     if (displayImageIndex.startsWith('https://')) {
//       service.images = service.images.map(it => {
//         if (it.url == displayImageIndex) {
//           return { ...it, displayImage: true };
//         }
//         else {
//           return { ...it, displayImage: false };
//         }
//       });
//       if (imagesResults) {
//         for (const x of imagesResults) {
//           service.images.push({ url: x.value, displayImage: false });
//         }
//       }
//     } else {
//       service.images = service.images.map(it => ({ ...it, displayImage: false }));
//       if (imagesResults) {
//         for (let i = 0; i < imagesResults.length; i++) {
//           service.images.push({ url: imagesResults[i].value, displayImage: displayImageIndex == i });
//         }
//       }
//     }
//   };
//   service.name = name;
//   service.description = description;
//   service.country = country;
//   service.state = state;
//   service.city = city;
//   service.price = price;

//   service.save();

//   return service;
// };

serviceSchema.statics.updateUserService = async function (userId, _id, price) {
  const service = await this.findOneAndUpdate(
    { _id: _id, seller: userId, status: { $ne: 'deleted' } },
    {
      $set: { price }
    },
    { new: true }
  );

  if (!service) {
    throwError(404, 'Service not found or service is deleted.');
  }

  return service;
};

serviceSchema.statics.deleteUserService = async function (userId, _id) {
  const service = await this.findOneAndUpdate(
    { _id: _id, seller: userId, status: { $ne: 'deleted' } },
    {
      $set: {
        status: 'deleted'
      }
    },
    { new: true }
  );

  if (!service) {
    throwError(404, 'User does not have this service or this service is already deleted.');
  }

  return service;
};

serviceSchema.statics.getUserServices = async function (userId, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  let query = { seller: userId, status: { $ne: 'deleted' }, 'boostPlan.name': 'No Plan' };

  const services = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return services;
};

serviceSchema.statics.getUserServicesBoosted = async function (userId, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  let query = { seller: userId, status: { $ne: 'deleted' }, 'boostPlan.name': { $ne: 'No Plan' } };

  const services = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return services;
};

serviceSchema.statics.getUserSearchedServices = async function (userId, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = { seller: userId, status: { $ne: 'deleted' }, name: { $regex: nameRegex }, 'boostPlan.name': 'No Plan' };

  const services = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return services;
};

serviceSchema.statics.getUserSearchedServicesBoosted = async function (userId, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = { seller: userId, status: { $ne: 'deleted' }, name: { $regex: nameRegex }, 'boostPlan.name': { $ne: 'No Plan' } };

  const services = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return services;
};

serviceSchema.statics.getHomeScreenServices = async function (userId, userAddress, page) {
  console.log("userId, userAddress", userId, userAddress);
  const limit = 20;
  const skip = (page - 1) * limit;
  // let query = { seller: { $ne: userId }, country: userAddress.country, status: 'active', moderationStatus: 'approved' };
  let query = { seller: userId, country: userAddress.country, status: 'active', moderationStatus: 'approved' };
  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $match: {
        'sellerDetails.status': 'active',
        'sellerDetails.adminStatus': 'active',
      },
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
  console.log("services", services);
  const wishlist = await wishlistServiceModel.getUserWishlistServicesAll(userId);
  const wishlistServiceIds = wishlist.map(it => it.service.toString());

  const abc = services.map(it => ({ ...it, isWishListed: wishlistServiceIds.includes(it._id.toString()) }));
  return abc;
};

serviceSchema.statics.getHomeScreenServicesGuestMode = async function (page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  let query = { status: 'active', moderationStatus: 'approved' };

  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $match: {
        'sellerDetails.status': 'active',
        'sellerDetails.adminStatus': 'active',
      },
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const abc = services.map(it => ({ ...it, isWishListed: false }));
  return abc;
};

serviceSchema.statics.getHomeScreenSearchedServices = async function (userId, userAddress, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = {
    seller: { $ne: userId }, country: userAddress.country, state: userAddress.state, city: userAddress.city, status: 'active', name: { $regex: nameRegex }
  };

  await homeScreenSearchServiceHistoryModel.addKeywordToUserHistory(userId, name);

  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $match: {
        'sellerDetails.status': 'active',
        'sellerDetails.adminStatus': 'active',
      },
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const wishlist = await wishlistServiceModel.getUserWishlistServicesAll(userId);
  const wishlistServiceIds = wishlist.map(it => it.service.toString());

  const abc = services.map(it => ({ ...it, isWishListed: wishlistServiceIds.includes(it._id.toString()) }));
  return abc;
};

serviceSchema.statics.getHomeScreenSearchedServicesGuestMode = async function (name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = {
    status: 'active', name: { $regex: nameRegex }
  };

  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $match: {
        'sellerDetails.status': 'active',
        'sellerDetails.adminStatus': 'active',
      },
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const abc = services.map(it => ({ ...it, isWishListed: false }));
  return abc;
};

serviceSchema.statics.getSellerServices = async function (user, sellerId, page) {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query = { seller: new mongoose.Types.ObjectId(sellerId), country: user.address.country, state: user.address.state, city: user.address.city, status: 'active' };

  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const wishlist = await wishlistServiceModel.getUserWishlistServicesAll(user._id);
  const wishlistServiceIds = wishlist.map(it => it.service.toString());

  const abc = services.map(it => ({ ...it, isWishListed: wishlistServiceIds.includes(it._id.toString()) }));
  return abc;
};

serviceSchema.statics.getSellerServicesGuestMode = async function (sellerId, page) {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query = { seller: new mongoose.Types.ObjectId(sellerId), status: 'active' };

  const services = await this.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDetails',
      },
    },
    {
      $unwind: '$sellerDetails',
    },
    {
      $sort: {
        'boostPlan.purchasedAt': -1,
        updatedAt: -1
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  const abc = services.map(it => ({ ...it, isWishListed: false }));
  return abc;
};

export default mongoose.model('service', serviceSchema);
