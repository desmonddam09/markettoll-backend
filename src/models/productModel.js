import mongoose from 'mongoose';
import { v4 } from 'uuid';
import homeScreenSearchProductHistoryModel from './homeScreenSearchProductHistoryModel.js';
import userModel from './userModel.js';
import { avgProductRatingSchema, imagesSchema, productBoostPlanSchema } from './schemas/index.js';
import { saveFile, throwError } from '../utils/index.js';
import { productPickupAddress } from '../helpers/index.js';
import wishlistProductModel from './wishlistProductModel.js';

export const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    images: { type: [imagesSchema], default: [] },
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    description: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    fulfillmentMethod: {
      selfPickup: { type: Boolean, default: false },
      delivery: { type: Boolean, default: false },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // Format: [longitude, latitude]
        default: [0, 0],
        validate: {
          validator: (val) => val.length === 2,
          message: 'Coordinates must be an array of [longitude, latitude]'
        }
      }
    },
    pickupAddress: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    quantitySold: { type: Number, default: 0 },
    ordersReceived: { type: Number, default: 0 },
    avgRating: {
      type: avgProductRatingSchema,
      default: () => ({})
    },
    boostPlan: { type: productBoostPlanSchema, default: () => ({}) },
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
      default: 'approved',
    },
    moderationReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ _id: 1, seller: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ name: 'text' });
// Add geospatial index
productSchema.index({ location: '2dsphere' });

//authorized routes
productSchema.statics.addUserProduct = async function (
  userId,
  userPickUpAddress,
  images,
  displayImageIndex,
  name,
  category,
  subCategory,
  description,
  country,
  state,
  city,
  fulfillmentMethod,
  pickupAddress,
  price,
  quantity,
  location,
  moderationStatus = 'pending_review',
  moderationReason = ''
) {
  if (!fulfillmentMethod.selfPickup && pickupAddress) {
    throwError(409, 'Pickup address is given but self pickup is not selected.');
  }

  if (fulfillmentMethod.selfPickup && !pickupAddress) {
    if (
      !userPickUpAddress.streetAddress ||
      !userPickUpAddress.country ||
      !userPickUpAddress.state ||
      !userPickUpAddress.city
    ) {
      throwError(404, 'User pickup address is not set.');
    }
  }

  const product = new this({
    seller: userId,
    name,
    category,
    subCategory,
    description,
    country,
    state,
    city,
    fulfillmentMethod,
    pickupAddress,
    price,
    quantity,
    moderationStatus,
    moderationReason,
    ...(location && { location }) // <-- only add if provided

  });

  const imagesPromises = images.map((item, index) => saveFile(`products/${product._id}/images/${v4()}`, item));

  const imagesResults = await Promise.allSettled(imagesPromises);

  for (const x of imagesResults) {
    if (x.status !== 'fulfilled') {
      throwError(400, 'Images could not be uploaded successfully.');
    }
  }

  for (let i = 0; i < imagesResults.length; i++) {
    product.images.push({ url: imagesResults[i].value, displayImage: displayImageIndex == i });
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
    await product.save({ session });

    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }

  if (fulfillmentMethod.selfPickup && !pickupAddress) {
    return { ...product._doc, pickupAddress: productPickupAddress(userPickUpAddress) };
  };

  return product;
};

productSchema.statics.updateUserProduct = async function (userId, userPickUpAddress, _id, price, quantity) {
  let backInStock = false;
  let product = await this.findOneAndUpdate(
    { _id: _id, seller: userId, status: { $ne: 'deleted' } },
    {
      $set: { price: price },
      $inc: { quantity: quantity }
    },
    { new: true }
  );

  if (!product) {
    throwError(404, 'User does not have this product or this product is deleted.');
  }

  if (product.fulfillmentMethod.selfPickup && !product.pickupAddress) {
    product = { ...product._doc, pickupAddress: productPickupAddress(userPickUpAddress) };
  }

  if (product.quantity === quantity) {
    backInStock = true;
  }

  return { backInStock, product };
};

productSchema.statics.deleteUserProduct = async function (userId, _id) {
  const product = await this.findOneAndUpdate(
    { _id: _id, seller: userId, status: { $ne: 'deleted' } },
    {
      $set: {
        status: 'deleted'
      }
    },
    { new: true }
  );

  if (!product) {
    throwError(404, 'User does not have this product or this product is already deleted.');
  }

  return product;
};

productSchema.statics.getUserProducts = async function (userId, userPickUpAddress, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  let query = { seller: userId, status: { $ne: 'deleted' }, 'boostPlan.name': 'No Plan' };

  const products = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return { ...it._doc, pickupAddress: productPickupAddress(userPickUpAddress) };
    } else {
      return it;
    }
  });

  return updatedProducts;
};

productSchema.statics.getUserProductsBoosted = async function (userId, userPickUpAddress, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  let query = { seller: userId, status: { $ne: 'deleted' }, 'boostPlan.name': { $ne: 'No Plan' } };

  const products = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return { ...it._doc, pickupAddress: productPickupAddress(userPickUpAddress) };
    } else {
      return it;
    }
  });

  return updatedProducts;
};

productSchema.statics.getUserSearchedProducts = async function (userId, userPickUpAddress, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = { seller: userId, status: { $ne: 'deleted' }, name: { $regex: nameRegex }, 'boostPlan.name': 'No Plan' };

  const products = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it._doc,
        pickupAddress: productPickupAddress(userPickUpAddress)
      };
    } else {
      return it;
    }
  });

  return updatedProducts;
};

productSchema.statics.getUserSearchedProductsBoosted = async function (userId, userPickUpAddress, name, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
  let query = { seller: userId, status: { $ne: 'deleted' }, name: { $regex: nameRegex }, 'boostPlan.name': { $ne: 'No Plan' } };

  const products = await this.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it._doc,
        pickupAddress: productPickupAddress(userPickUpAddress)
      };
    } else {
      return it;
    }
  });

  return updatedProducts;
};

//buyer routes
productSchema.statics.getHomeScreenProducts = async function (userId, userAddress, filters = {}) {
  const numCategories = 5;
  const numProductsPerCategory = 10;
  console.log("userAddress==", userAddress);


  const matchQuery = {
    seller: userId,
    country: userAddress.country,
    status: 'active',
    adminStatus: 'active',
    moderationStatus: 'approved'
  };

  // Optional filters
  if (filters.state) matchQuery.state = filters.state;
  if (filters.city) matchQuery.city = filters.city;

  const geoMatch = filters.geoFilter || {};

  const categoryProducts = await this.aggregate([
    // {
    //   $match: {
    //     seller: { $ne: userId },
    //     country: userAddress.country,
    //     // state: userAddress.state,
    //     // city: userAddress.city,
    //     status: 'active',
    //     adminStatus: 'active',
    //   },
    // },
    { $match: { ...matchQuery, ...geoMatch } },
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
      },
    },
    {
      $group: {
        _id: '$category',
        products: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        category: '$_id',
        products: {
          $slice: ['$products', numProductsPerCategory]
        },
        _id: 0
      }
    },
    {
      $addFields: {
        randomField: { $rand: {} }
      }
    },
    {
      $sort: { randomField: 1 }
    },
    {
      $limit: numCategories
    }
  ]);

  const wishlist = await wishlistProductModel.getUserWishlistProductsAll(userId);
  const wishlistProductIds = wishlist.map(it => it.product.toString());

  const updatedCategoryProducts = categoryProducts.map(it => {
    const updatedProducts = it.products.map(it2 => {
      if (it2.fulfillmentMethod.selfPickup && !it2.pickupAddress) {
        return {
          ...it2, pickupAddress: productPickupAddress(it2.sellerDetails.pickupAddress), isWishListed: wishlistProductIds.includes(it2._id.toString())
        };
      }
      return {
        ...it2, isWishListed: wishlistProductIds.includes(it2._id.toString())
      };
    });
    return { ...it, products: updatedProducts };
  });

  return updatedCategoryProducts;
};

productSchema.statics.getHomeScreenProductsGuestMode = async function () {
  const numCategories = 5;
  const numProductsPerCategory = 10;

  const categoryProducts = await this.aggregate([
    {
      $match: {
        status: 'active',
        adminStatus: 'active',
        moderationStatus: 'approved'
      },
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
      },
    },
    {
      $group: {
        _id: '$category',
        products: { $push: '$$ROOT' }
      }
    },
    {
      $project: {
        category: '$_id',
        products: {
          $slice: ['$products', numProductsPerCategory]
        },
        _id: 0
      }
    },
    {
      $addFields: {
        randomField: { $rand: {} }
      }
    },
    {
      $sort: { randomField: 1 }
    },
    {
      $limit: numCategories
    }
  ]);

  const updatedCategoryProducts = categoryProducts.map(it => {
    const updatedProducts = it.products.map(it2 => {
      if (it2.fulfillmentMethod.selfPickup && !it2.pickupAddress) {
        return {
          ...it2, pickupAddress: productPickupAddress(it2.sellerDetails.pickupAddress), isWishListed: false
        };
      }
      return { ...it2, isWishListed: false };
    });
    return { ...it, products: updatedProducts };
  });

  return updatedCategoryProducts;
};

productSchema.statics.getHomeScreenSearchedProducts = async function (userId, userAddress, name, category, subCategory, page, city, state, lat, lng, radius) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');

  let query = { seller: { $ne: userId }, country: userAddress.country, /* state: userAddress.state, city: userAddress.city, */ status: 'active', adminStatus: 'active', moderationStatus: 'approved' };

  if (name) {
    await homeScreenSearchProductHistoryModel.addKeywordToUserHistory(userId, name);
    query = { ...query, name: { $regex: nameRegex } };
  }
  if (category) {
    query = { ...query, category };
  }
  if (subCategory) {
    query = { ...query, subCategory };
  }
  if (state) query.state = state;
  if (city) query.city = city;

  let geoFilter = {};
  if (lat && lng && radius) {
    const center = [parseFloat(lng), parseFloat(lat)];
    const radiusInKm = parseFloat(radius) / 6378.1; // Convert to radians
    geoFilter = {
      location: {
        $geoWithin: {
          $centerSphere: [center, radiusInKm]
        }
      }
    };
  }

  const products = await this.aggregate([
    {
      $match: { ...query, ...geoFilter }
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

  const wishlist = await wishlistProductModel.getUserWishlistProductsAll(userId);
  const wishlistProductIds = wishlist.map(it => it.product.toString());

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: wishlistProductIds.includes(it._id.toString())
      };
    }
    return {
      ...it, isWishListed: wishlistProductIds.includes(it._id.toString())
    };
  });

  return updatedProducts;
};

productSchema.statics.getHomeScreenSearchedProductsGuestMode = async function (name, category, subCategory, page) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');

  let query = { status: 'active', adminStatus: 'active' };

  if (name) {
    query = { ...query, name: { $regex: nameRegex } };
  }
  if (category) {
    query = { ...query, category };
  }
  if (subCategory) {
    query = { ...query, subCategory };
  }

  const products = await this.aggregate([
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

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: false
      };
    }
    return {
      ...it, isWishListed: false
    };
  });

  return updatedProducts;
};

productSchema.statics.getSellerProducts = async function (user, sellerId, page) {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query = { seller: new mongoose.Types.ObjectId(sellerId), country: user.address.country, state: user.address.state, city: user.address.city, status: 'active', adminStatus: 'active' };

  const products = await this.aggregate([
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

  const wishlist = await wishlistProductModel.getUserWishlistProductsAll(user._id);
  const wishlistProductIds = wishlist.map(it => it.product.toString());

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: wishlistProductIds.includes(it._id.toString())
      };
    }
    return { ...it, isWishListed: wishlistProductIds.includes(it._id.toString()) };
  });

  return updatedProducts;
};

productSchema.statics.getSellerProductsGuestMode = async function (sellerId, page) {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query = { seller: new mongoose.Types.ObjectId(sellerId), status: 'active', adminStatus: 'active' };

  const products = await this.aggregate([
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

  const updatedProducts = products.map(it => {
    if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
      return {
        ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: false
      };
    }
    return {
      ...it, isWishListed: false
    };
  });

  return updatedProducts;
};

export default mongoose.model('product', productSchema);
