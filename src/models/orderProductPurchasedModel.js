import mongoose from 'mongoose';
import { addressSchema, stripeCustomerSchema } from './schemas/index.js';
import { productSchema } from './productModel.js';
import { formatOrderProductProducts } from '../helpers/index.js';
import productReviewModel from './productReviewModel.js';
import wishlistProductModel from './wishlistProductModel.js';

const orderProductPurchasedSchema = new mongoose.Schema(
  {
    placer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    deliveryAddress: {
      type: addressSchema,
      default: () => ({})
    },
    paymentIntentId: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      required: true
    },
    stripeCustomer: {
      type: stripeCustomerSchema,
      default: () => ({})
    },
    platformFee: {
      type: Number,
      required: true
    },
    products: {
      type: [{
        product: { type: productSchema, required: true },
        fulfillmentMethod: {
          selfPickup: { type: Boolean, required: true },
          delivery: { type: Boolean, required: true },
        },
        quantity: { type: Number, required: true },
      }],
      default: []
    },
  },
  {
    timestamps: true
  }
);

orderProductPurchasedSchema.index({ placer: 1, createdAt: -1 });
orderProductPurchasedSchema.index({ 'products.product.seller': 1, createdAt: 1 });
orderProductPurchasedSchema.index({ _id: 1, placer: 1, 'products.product._id': 1, createdAt: 1 });

orderProductPurchasedSchema.statics.getOrders = async function (name, page) {
  const limit = 100;
  const skip = (page - 1) * limit;
  let query = {};
  if (name) {
    const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
    query = {
      $or: [
        { 'placerDetails.name': { $regex: nameRegex } },
        { 'placerDetails.email.value': { $regex: nameRegex } }
      ]
    };
  }
  const orders = await this.aggregate([
    {
      $match: {}
    },
    {
      $lookup: {
        from: 'users',
        localField: 'placer',
        foreignField: '_id',
        as: 'placerDetails'
      }
    },
    {
      $unwind: '$placerDetails'
    },
    {
      $match: query
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'products.product.seller',
        foreignField: '_id',
        as: 'products.product.seller'
      }
    },
    {
      $unwind: '$products.product.seller'
    },
    {
      $group: {
        _id: '$_id',
        placer: { $first: '$placer' },
        placerDetails: { $first: '$placerDetails' },
        deliveryAddress: { $first: '$deliveryAddress' },
        createdAt: { $first: '$createdAt' },
        paymentMethod: { $first: '$paymentMethod' },
        stripeCustomer: { $first: '$stripeCustomer' },
        platformFee: { $first: '$platformFee' },
        products: { $push: '$products' },
        updatedAt: { $first: '$updatedAt' },
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  const abc = orders.map(it => {
    const { products, ...restOfDoc } = it;
    return { ...restOfDoc, sellersProducts: formatOrderProductProducts(products, 'yes') };
  });

  let result = abc.map(it => {
    let total = 0;

    return {
      ...it,
      sellersProducts: it.sellersProducts.map(it2 => ({
        ...it2,
        fulfillmentMethods: it2.fulfillmentMethods.map(it3 => ({
          ...it3,
          products: it3.products.map(it4 => {
            total += it4.quantity * it4.product.price;
            return {
              ...it4
            };
          })
        }))
      })),
      total: total.toFixed(2)
    };
  });

  return result;
};

orderProductPurchasedSchema.statics.getUserOrderProductPurchasedCurrent = async function (userId) {
  const startDate = new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000);

  const orders = await this.find({
    placer: userId,
    createdAt: {
      $gte: startDate,
    },
  })
    .populate('products.product.seller')
    .sort({ createdAt: -1 })
    .exec();

  const wishlist = await wishlistProductModel.getUserWishlistProductsAll(userId);
  const wishlistProductIds = wishlist.map(it => it.product.toString());

  const abc = orders.map(it => {
    const { products, ...restOfDoc } = it._doc;
    return { ...restOfDoc, sellersProducts: formatOrderProductProducts(products) };
  });

  let result = abc.map(it => {
    let total = 0;

    return {
      ...it,
      sellersProducts: it.sellersProducts.map(it2 => ({
        ...it2,
        fulfillmentMethods: it2.fulfillmentMethods.map(it3 => ({
          ...it3,
          products: it3.products.map(it4 => {
            total += it4.quantity * it4.product.price;
            return {
              ...it4,
              isWishListed: wishlistProductIds.includes(it4.product._id.toString())
            };
          })
        }))
      })),
      total: total.toFixed(2)
    };
  });

  return result;
};

orderProductPurchasedSchema.statics.getUserOrderProductPurchasedPast = async function (userId, page) {
  const startDate = new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000);
  const limit = 20;
  const skip = (page - 1) * limit;

  const orders = await this.find({
    placer: userId,
    createdAt: {
      $lt: startDate,
    },
  })
    .populate('products.product.seller')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  let data = orders.map(it => {
    const { products, ...restOfDoc } = it._doc;
    return { ...restOfDoc, sellersProducts: formatOrderProductProducts(products) };
  });

  const placerReviews = await productReviewModel.getReviewerReviews(userId);
  const reviewedProductIds = new Set(
    placerReviews.map(it => `${it.orderProductPurchased.toString()}-${it.product._id.toString()}`)
  );

  return data.map(it => {
    let total = 0;
    return {
      ...it, sellersProducts: it.sellersProducts.map(it2 => {
        return {
          ...it2,
          fulfillmentMethods: it2.fulfillmentMethods.map(it3 => {
            return {
              ...it3,
              products: it3.products.map(it4 => {
                total += it4.quantity * it4.product.price;
                const reviewKey = `${it._id}-${it4._id}`;
                return {
                  ...it4, hasReviewed: reviewedProductIds.has(reviewKey)
                };
              })
            };
          })
        };
      }),
      total: total.toFixed(2)
    };
  });
};

orderProductPurchasedSchema.statics.getUserOrderProductReceivedCurrent = async function (userId) {
  const startDate = new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000);

  const orders = await this.aggregate([
    {
      $match: {
        'products.product.seller': userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $addFields: {
        products: {
          $filter: {
            input: '$products',
            as: 'product',
            cond: { $eq: ['$$product.product.seller', userId] }
          }
        }
      }
    },
    {
      $match: {
        'products.0': { $exists: true }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'placer',
        foreignField: '_id',
        as: 'placerDetails'
      }
    },
    {
      $unwind: '$placerDetails'
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'products.product.seller',
        foreignField: '_id',
        as: 'products.product.seller'
      }
    },
    {
      $unwind: '$products.product.seller'
    },
    {
      $group: {
        _id: '$_id',
        placer: { $first: '$placer' },
        placerDetails: { $first: '$placerDetails' },
        createdAt: { $first: '$createdAt' },
        deliveryAddress: { $first: '$deliveryAddress' },
        paymentMethod: { $first: '$paymentMethod' },
        stripeCustomer: { $first: '$stripeCustomer' },
        platformFee: { $first: '$platformFee' },
        products: { $push: '$products' },
        updatedAt: { $first: '$updatedAt' },
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  return orders.map(it => {
    let total = 0;
    return {
      ...it, products: it.products.map(it2 => {
        total += it2.quantity * it2.product.price;
        return {
          ...it2
        };
      }),
      total: total.toFixed(2),
      deduction: (total.toFixed(2) * it.platformFee).toFixed(2)
    };
  });
};

orderProductPurchasedSchema.statics.getUserOrderProductReceivedPast = async function (userId, page) {
  const startDate = new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000);
  const limit = 20;
  const skip = (page - 1) * limit;

  const orders = await this.aggregate([
    {
      $match: {
        'products.product.seller': userId,
        createdAt: { $lt: startDate }
      }
    },
    {
      $addFields: {
        products: {
          $filter: {
            input: '$products',
            as: 'product',
            cond: { $eq: ['$$product.product.seller', userId] }
          }
        }
      }
    },
    {
      $match: {
        'products.0': { $exists: true }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'placer',
        foreignField: '_id',
        as: 'placerDetails'
      }
    },
    {
      $unwind: '$placerDetails'
    },
    {
      $unwind: '$products'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'products.product.seller',
        foreignField: '_id',
        as: 'products.product.seller'
      }
    },
    {
      $unwind: '$products.product.seller'
    },
    {
      $group: {
        _id: '$_id',
        placer: { $first: '$placer' },
        placerDetails: { $first: '$placerDetails' },
        createdAt: { $first: '$createdAt' },
        deliveryAddress: { $first: '$deliveryAddress' },
        paymentMethod: { $first: '$paymentMethod' },
        stripeCustomer: { $first: '$stripeCustomer' },
        platformFee: { $first: '$platformFee' },
        products: { $push: '$products' },
        updatedAt: { $first: '$updatedAt' },
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  return orders.map(it => {
    let total = 0;
    return {
      ...it, products: it.products.map(it2 => {
        total += it2.quantity * it2.product.price;
        return {
          ...it2
        };
      }),
      total: total.toFixed(2),
      deduction: (total.toFixed(2) * it.platformFee).toFixed(2)
    };
  });
};

export default mongoose.model('orderProductPurchased', orderProductPurchasedSchema);
