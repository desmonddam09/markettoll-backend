import { adminNotificationsModel, orderProductPurchasedModel, productAndSubscriptionRevenueModel, productCategoryModel, productModel, reportedUserModel, serviceModel, stripeProfitsModel, userModel } from "../models/index.js";
import { createAdminPayout } from "../stripe/index.js";
import { saveFile, sendNotification, throwError, sendEmail, getSubscriptionPrices, getBoostPrices, createJWT } from "../utils/index.js";
import { v4 } from 'uuid';
import mongoose from 'mongoose';
import emailSupportRequestModel from "../models/emailSupportRequestModel.js";
import productReviewModel from "../models/productReviewModel.js";
import formatOrderProductProducts from "../helpers/formatOrderProductProducts.js";
import InfluencerSettings from "../models/influencerSettingsModel.js";
import { allInfluencerRatesSchema, approveAffiliateSchema, influencerGoalschema, influencerRateSchema, payoutActionSchema, toggleReferralStatusSchema, updateAffiliateGoalSchema, updateInfluencerGoalschema, updateInfluencerRateSettingsSchema, updateInfluencerSettingsSchema } from "../validations/influencerValidation.js";
import PayoutRequest from "../models/payoutRequestModel.js";
import InfluencerWallet from "../models/influencerWalletModel.js";
import { sendPayoutToInfluencer } from "../stripe/sendPayoutToInfluencer.js";
import influencerReferralModel from "../models/influencerReferralModel.js";
import InfluencerGoal from "../models/influencerGoalModel.js";
import InfluencerRateSettings from "../models/influencerRateSettingsModel.js";
import AffiliateGoal from "../models/affiliateGoalModel.js";


export const emailPasswordLogIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await userModel.emailPasswordLogInAdmin(email, password);
    const token = createJWT(data._id);
    res.status(201).json({
      success: true,
      message: 'Login successful.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const getReportedUsers = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await reportedUserModel.getReportedUsers(page);
    res.status(200).json({
      success: true,
      message: 'User reports retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await orderProductPurchasedModel.getOrders(name, page);
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const notification = async (req, res, next) => {
  try {
    const { scheduleDate, title, body } = req.body;
    if (scheduleDate) {
      adminNotificationsModel.addNotification('schedule', title, [], body, scheduleDate, null);
    } else {
      sendNotification.sendAdminNotification(title, body).catch(err => { });
    }
    res.status(scheduleDate ? 201 : 200).json({
      success: true,
      message: scheduleDate ? 'Schedule notification created successfully.' : 'Notification sent successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await adminNotificationsModel.getAll(page);
    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getDeletedAccounts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = { status: 'deleted' };
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    const data = await userModel.find(query).sort({ name: 1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'Deleted accounts retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req, res, next) => {
  console.log("getProduts", req.query);
  try {
    const { name, category, subCategory, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = { status: 'active', adminStatus: 'active', moderationStatus: 'approved' };
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    if (category) {
      query = { ...query, category };
    }
    if (subCategory) {
      query = { ...query, subCategory };
    }
    const data = await productModel.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      },
      {
        $match: {
          'seller.status': 'active',
          'seller.adminStatus': 'active'
        }
      },
      {
        $sort: { name: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingReviewProducts = async (req, res, next) => {
  try {
    const { name, category, subCategory, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = { status: 'active', adminStatus: 'active', moderationStatus: 'pending_review' };
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    if (category) {
      query = { ...query, category };
    }
    if (subCategory) {
      query = { ...query, subCategory };
    }
    const data = await productModel.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      },
      {
        $match: {
          'seller.status': 'active',
          'seller.adminStatus': 'active'
        }
      },
      {
        $sort: { name: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const moderateProducts = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'No product ids provided.' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const moderationStatus = status === 'accepted' ? 'approved' : 'rejected';
    const moderationReason = status === 'accepted' ? '' : 'Rejected by admin';
    const result = await productModel.updateMany(
      { _id: { $in: ids }, moderationStatus: 'pending_review' },
      { $set: { moderationStatus, moderationReason } }
    );
    res.status(200).json({
      success: true,
      message: `Products ${status === 'accepted' ? 'approved' : 'rejected'} successfully.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

export const moderateServices = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'No Service ids provided.' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const moderationStatus = status === 'accepted' ? 'approved' : 'rejected';
    const moderationReason = status === 'accepted' ? '' : 'Rejected by admin';
    const result = await serviceModel.updateMany(
      { _id: { $in: ids }, moderationStatus: 'pending_review' },
      { $set: { moderationStatus, moderationReason } }
    );
    res.status(200).json({
      success: true,
      message: `Products ${status === 'accepted' ? 'approved' : 'rejected'} successfully.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingReviewServices = async (req, res, next) => {

  console.log("sfsfsdfsfsfdsds", req.query);
  try {
    const { name, page } = req.query;
    const limit = 50;
    const skip = (page - 1) * limit;
    let query = { status: 'active', adminStatus: 'active', moderationStatus: 'pending_review' };

    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    const services = await serviceModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
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

    const total = await serviceModel.countDocuments({
      moderationStatus: 'pending_review',
      status: { $ne: 'deleted' }
    });

    res.status(200).json({
      success: true,
      message: 'Pending review services retrieved successfully.',
      data: {
        items: services,
        total,
        page: parseInt(page) || 1,
        limit,
        hasMore: skip + limit < total
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getDeactivatedProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = { status: { $in: ['active', 'inactive'] } };
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    const data = await productModel.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      },
      {
        $match: { 'seller.status': { $in: ['active', 'inactive'] } }
      },
      {
        $match: {
          $or: [
            {
              status: 'inactive',
            },
            {
              adminStatus: 'blocked',
            },
            {
              'seller.status': 'inactive',
            },
            {
              'seller.adminStatus': 'blocked',
            }
          ]
        }
      },
      {
        $sort: { name: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Deactivated products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = { status: { $in: ['active', 'inactive'] } };
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { ...query, name: { $regex: nameRegex } };
    }
    const data = await serviceModel.find(query).populate('seller').sort({ name: 1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.blockUser(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'User blocked successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.unblockUser(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'User unblocked successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const addCategory = async (req, res, next) => {
  try {
    const images = req.files?.filter(t => t.fieldname === 'images');
    const { categoryName } = req.body;

    const formattedCategoryName = categoryName.replace(/\s+/g, '');

    const imagesPromises = [
      saveFile(`categories/${formattedCategoryName}/${v4()}`, images[0])
    ];

    const imagesResults = await Promise.allSettled(imagesPromises);

    for (const x of imagesResults) {
      if (x.status !== 'fulfilled') {
        throwError(400, 'Images could not be uploaded successfully.');
      }
    }

    await productCategoryModel.addCategory(
      categoryName,
      imagesResults[0].value,
    );

    res.status(201).json({
      success: true,
      message: 'Category added successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const addSubcategory = async (req, res, next) => {
  try {
    const images = req.files?.filter(t => t.fieldname === 'images');
    const { categoryName, subcategoryNames } = req.body;
    const formattedCategoryName = categoryName.replace(/\s+/g, '');

    const imagesPromises = [];

    for (let i = 0; i < images.length; i++) {
      imagesPromises.push(saveFile(`categories/${formattedCategoryName}/subcategory/${v4()}`, images[i]));
    }

    const imagesResults = await Promise.allSettled(imagesPromises);

    for (const x of imagesResults) {
      if (x.status !== 'fulfilled') {
        throwError(400, 'Images could not be uploaded successfully.');
      }
    }

    await productCategoryModel.addSubcategory(
      categoryName,
      {
        names: JSON.parse(subcategoryNames),
        images: imagesResults.map(it => it.value)
      }
    );

    res.status(201).json({
      success: true,
      message: 'Subcategories added successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const createPayoutProfits = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const profits = await stripeProfitsModel.findOne({ type: 'adminProfits' }).session(session);
      if (!profits) {
        throwError(404, 'Not enough funds in wallet.');
      }
      if (profits.value < amount) {
        throwError(409, 'Not enough funds in wallet.');
      }

      await createAdminPayout(amount);

      profits.value = (profits.value - amount).toFixed(2);
      await profits.save({ session });

      await session.commitTransaction();
      await session.endSession();

    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      throw err;
    }

    res.status(201).json({
      success: true,
      message: 'Payout created successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = {};
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = {
        $or: [
          { name: { $regex: nameRegex } },
          { 'email.value': { $regex: nameRegex } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$phoneNumber.code', '$phoneNumber.value'] },
                regex: nameRegex
              }
            }
          }
        ]
      };
    }
    const data = await userModel.find(query).sort({ name: 1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const emailSupportReply = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { body } = req.body;
    const now = new Date();

    const doc = await emailSupportRequestModel.findById(_id).populate('user');
    if (!doc) {
      throwError(404, 'Email support request not found.');
    }
    if (!doc.user) {
      throwError(404, 'Email support request user not found.');
    }
    if (doc.status === 'closed') {
      throwError(409, 'Email support ticket already closed.');
    }
    if (doc.repliedAt) {
      throwError(409, 'Already replied to this request.');
    }
    if (!doc.title) {
      throwError(404, 'Email support request does not have a title.');
    }
    if (!doc.user.email.value) {
      throwError(404, 'Email support request user"s email not found.');
    }

    await sendEmail.genericEmail(doc.user.email.value, doc.title, body, doc.user.name);
    doc.repliedAt = now;
    await doc.save();
    res.status(201).json({
      success: true,
      message: 'Replied successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const emailSupportCloseTicket = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const doc = await emailSupportRequestModel.findById(_id);
    if (!doc) {
      throwError(404, 'Email support request not found.');
    }
    if (doc.status === 'closed') {
      throwError(409, 'Email support ticket already closed.');
    }
    doc.status = 'closed';
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Email support request ticket closed successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const activeSubscriptions = async (req, res, next) => {
  try {
    const { subscription, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = {};
    switch (subscription) {
      case '-1':
        query = { 'subscriptionPlan.name': { $ne: 'No Plan' } };
        break;
      case '1':
        query = { 'subscriptionPlan.name': 'No Plan' };
        break;
      case '2':
        query = { 'subscriptionPlan.name': 'Free Plan' };
        break;
      case '3':
        query = { 'subscriptionPlan.name': 'Basic Plan' };
        break;
      case '4':
        query = { 'subscriptionPlan.name': 'Standard Plan' };
        break;
      case '5':
        query = { 'subscriptionPlan.name': 'Premium Plan' };
        break;
    }
    const data = await userModel.find(query).sort({ name: 1 }).skip(skip).limit(limit).select({ id: 1, name: 1, email: 1, subscriptionPlan: 1 }).lean();
    const changed = data.map(it => ({ ...it, subscriptionPlan: { ...it.subscriptionPlan, price: getSubscriptionPrices(it.subscriptionPlan.name) } }));

    res.status(200).json({
      success: true,
      message: 'Active subscriptions retrieved successfully.',
      data: changed
    });
  } catch (err) {
    next(err);
  }
};

export const activeBoosts = async (req, res, next) => {
  try {
    const { boost, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = {};
    switch (boost) {
      case '-1':
        query = { 'boostPlan.name': { $ne: 'No Plan' } };
        break;
      case '1':
        query = { 'boostPlan.name': 'No Plan' };
        break;
      case '2':
        query = { 'boostPlan.name': 'Free Plan' };
        break;
      case '3':
        query = { 'boostPlan.name': 'Quick Start' };
        break;
      case '4':
        query = { 'boostPlan.name': 'Extended Exposure' };
        break;
      case '5':
        query = { 'boostPlan.name': 'Maximum Impact' };
        break;
    }
    const data = await productModel.find(query).populate('seller', 'name email').sort({ 'seller.name': 1 }).skip(skip).limit(limit).select('name boostPlan').lean();
    const changed = data.map(it => ({ ...it, boostPlan: { ...it.boostPlan, price: getBoostPrices(it.boostPlan.name) } }));

    res.status(200).json({
      success: true,
      message: 'Active boosts retrieved successfully.',
      data: changed
    });
  } catch (err) {
    next(err);
  }
};

export const yearlyOrders = async (req, res, next) => {
  try {
    const { year } = req.query;
    const now = new Date(year);
    const data = await orderProductPurchasedModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          order_count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Yearly orders data retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const yearlySubscriptionRevenue = async (req, res, next) => {
  try {
    const { year } = req.query;
    const now = new Date(year);
    const data = await productAndSubscriptionRevenueModel.aggregate([
      {
        $match: {
          type: 'subscription',
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Yearly subscription data retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const emailSupportRequest = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = {};
    if (name) {
      const nameRegex = new RegExp(name.trim().split('').join('.*'), 'i');
      query = { 'user.name': { $regex: nameRegex } };
    }
    const data = await emailSupportRequestModel.aggregate([
      {
        $match: {}
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: query
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Email support requests retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const blockedUsers = async (req, res, next) => {
  try {
    const { page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    const data = await userModel.find({ adminStatus: 'blocked' }).sort({ name: 1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'Blocked users retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deactivateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const p = await productModel.findOneAndUpdate(
      { _id, adminStatus: 'active' },
      {
        $set: {
          adminStatus: 'blocked'
        }
      },
      { new: true }
    );

    if (!p) {
      throwError(409, 'Product not found or product already deactivated.');
    }

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const activateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const p = await productModel.findOneAndUpdate(
      { _id, adminStatus: 'blocked' },
      {
        $set: {
          adminStatus: 'active'
        }
      },
      { new: true }
    );

    if (!p) {
      throwError(409, 'Product not found or product already active.');
    }

    res.status(200).json({
      success: true,
      message: 'Product activated successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const productReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;

    const limit = 100;
    const skip = (page - 1) * limit;

    let query = {
      'product._id': _id,
    };

    const data = await productReviewModel.find(query)
      .populate('reviewer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const productOrders = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    const data = await orderProductPurchasedModel.aggregate([
      {
        $match: {
          "products.product._id": new mongoose.Types.ObjectId(_id),
        },
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
        $project: {
          _id: 1,
          placer: 1,
          placerDetails: 1,
          deliveryAddress: 1,
          paymentIntentId: 1,
          paymentMethod: 1,
          stripeCustomer: 1,
          platformFee: 1,
          createdAt: 1,
          updatedAt: 1,
          product: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$products",
                  as: "item",
                  cond: {
                    $eq: ["$$item.product._id", new mongoose.Types.ObjectId(_id)],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Product orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userOrders = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;

    const limit = 100;
    const skip = (page - 1) * limit;

    const orders = await orderProductPurchasedModel.find({ placer: _id }).populate('products.product.seller').sort({ createdAt: -1 }).skip(skip).limit(limit);

    const abc = orders.map(it => {
      const { products, ...restOfDoc } = it._doc;
      return { ...restOfDoc, sellersProducts: formatOrderProductProducts(products) };
    });

    let data = abc.map(it => {
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
                isWishListed: false
              };
            })
          }))
        })),
        total: total.toFixed(2)
      };
    });

    res.status(200).json({
      success: true,
      message: 'User orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userSubscriptions = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    const data = await productAndSubscriptionRevenueModel.find({ user: _id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'User subscriptions retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userListings = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;

    const limit = 100;
    const skip = (page - 1) * limit;

    const data = await productModel.find({ seller: _id, 'boostPlan.name': "No Plan", status: { $in: ['active', 'inactive'] } }).sort({ name: 1 }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      message: 'User products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userListingsBoosted = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;

    const limit = 100;
    const skip = (page - 1) * limit;

    const data = await productModel.find({ seller: _id, 'boostPlan.name': { $ne: "No Plan" }, status: { $in: ['active', 'inactive'] } }).sort({ name: 1 }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      message: 'User products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;

    const limit = 100;
    const skip = (page - 1) * limit;

    const data = await productReviewModel.find({ reviewer: _id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('reviewer');

    res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const usersRegisteredInMonth = async (req, res, next) => {
  try {
    const { month, year, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);

    const data = await userModel.find({ createdAt: { $gte: startDate, $lt: endDate } }).sort({ name: 1 }).skip(skip).limit(limit);
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const userSubscriptionsInMonth = async (req, res, next) => {
  try {
    const { month, year, page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);

    const data = await productAndSubscriptionRevenueModel.aggregate([{
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      },
    },
    {
      $sort: { 'userDetails.name': 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
    ]);

    res.status(200).json({
      success: true,
      message: 'User subscriptions retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};


const getInfluencerSettings = async (req, res) => {
  try {

    let settings = await InfluencerSettings.findOne().select('influencerStatus createdAt');

    if (!settings) {
      settings = await InfluencerSettings.create({});
    }

    res.status(200).json({
      success: true,
      message: 'Influencer settings fetched successfully.',
      data: settings,
    });
  } catch (err) {
    console.log("Error fetching influencer settings:", err.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer settings.',
      error: err.message,
    });
  }
};

const getInfluencerRateSettings = async (req, res) => {
  try {

    let settings = await InfluencerRateSettings.findOne().select('rateStatus createdAt');

    if (!settings) {
      settings = await InfluencerRateSettings.create({});
    }

    res.status(200).json({
      success: true,
      message: 'Rate settings fetched successfully.',
      data: settings,
    });
  } catch (err) {
    console.log("Error fetching rate settings:", err.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch influencer settings.',
      error: err.message,
    });
  }
};

const updateInfluencerRateSettings = async (req, res) => {
  try {
    const { error, value } = updateInfluencerRateSettingsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let settings = await InfluencerRateSettings.findOne();

    if (!settings) {
      settings = new InfluencerRateSettings(value);
    } else {
      settings.rateStatus = value.rateStatus;
    }

    await settings.save();

    return res.status(200).json({
      message: 'Rate settings updated successfully.',
      data: settings,
    });
  } catch (err) {
    console.error('Error updating Rate settings:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateInfluencerSettings = async (req, res) => {
  try {
    const { error, value } = updateInfluencerSettingsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let settings = await InfluencerSettings.findOne();

    if (!settings) {
      settings = new InfluencerSettings(value);
    } else {
      settings.influencerStatus = value.influencerStatus;
    }

    await settings.save();

    // ✅ If changed to 'auto', approve all pending influencer requests
    if (value.influencerStatus === 'auto') {
      await userModel.updateMany(
        { role: 'influencer', influencerStatus: 'inactive' },
        { $set: { influencerStatus: 'active' } }
      );
    }

    return res.status(200).json({
      message: 'Influencer settings updated successfully.',
      data: settings,
    });
  } catch (err) {
    console.error('Error updating influencer settings:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllInfluencers = async (req, res) => {
  try {
    const {
      name,
      email,
      emailVerified,
      startDate,
      endDate,
      referrals, // 'asc' | 'desc'
      commission, // 'asc' | 'desc'
      totalEarning // 'asc' | 'desc'
    } = req.query;

    let filter = {
      role: 'influencer'
    };

    // Name (case-insensitive partial match)
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    // Email (case-insensitive partial match)
    if (email) {
      filter['email.value'] = { $regex: email, $options: 'i' };
    }

    // Email verified
    if (emailVerified !== undefined) {
      filter['email.verified'] = emailVerified === 'true';
    }

    // Date filter (createdAt range)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }


    const influencers = await userModel.find(filter).select('-password');

    const influencerData = await Promise.all(
      influencers.map(async (influencer) => {
        const influencerId = influencer._id;

        const referredUsersCount = await userModel.countDocuments({
          influencerRef: influencerId,
        });

        const affiliateReferredCount = await userModel.countDocuments({
          influencerRef: influencerId,
          role: "influencer",
        });

        const wallet = await InfluencerWallet.findOne({ influencer: influencerId });
        const totalEarning = wallet?.amount || 0;

        const paidPayouts = await PayoutRequest.aggregate([
          {
            $match: {
              influencer: influencerId,
              status: 'approved',
            },
          },
          {
            $group: {
              _id: null,
              totalPaid: { $sum: '$amount' },
            },
          },
        ]);
        const totalPaid = paidPayouts[0]?.totalPaid || 0;

        const referralData = await influencerReferralModel.findOne({
          influencer: influencerId,
        });
        const referralLink = referralData?.referralLink || null;
        const isActive = referralData?.isActive ?? null;

        return {
          ...influencer.toObject(),
          referredUsersCount,
          affiliateReferredCount,
          totalEarning,
          totalPaid,
          referralLink,
          isActive,
        };
      })
    );

    // 🔽 Sort logic
    if (referrals === 'asc') {
      influencerData.sort((a, b) => a.referredUsersCount - b.referredUsersCount);
    } else if (referrals === 'desc') {
      influencerData.sort((a, b) => b.referredUsersCount - a.referredUsersCount);
    }

    if (commission === 'asc') {
      influencerData.sort((a, b) => (a.influencerRate || 0) - (b.influencerRate || 0));
    } else if (commission === 'desc') {
      influencerData.sort((a, b) => (b.influencerRate || 0) - (a.influencerRate || 0));
    }

    if (totalEarning === 'asc') {
      influencerData.sort((a, b) => a.totalEarning - b.totalEarning);
    } else if (totalEarning === 'desc') {
      influencerData.sort((a, b) => b.totalEarning - a.totalEarning);
    }

    return res.status(200).json({
      success: true,
      message: 'All influencers fetched successfully.',
      data: influencerData,
    });
  } catch (error) {
    console.error('Error fetching influencers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getAffiliateStats = async (req, res) => {
  try {
    // 1. Total active affiliates
    const totalAffiliates = await userModel.countDocuments({
      role: 'influencer',
      influencerStatus: 'active',
    });

    // 2. Total pending affiliate requests
    const pendingRequests = await userModel.countDocuments({
      role: 'influencer',
      influencerStatus: 'inactive',
    });

    // 3. Total referred users (status: 'active')
    const totalReferredUsers = await userModel.countDocuments({
      influencerRef: { $ne: null },
      status: 'active',
    });

    // 4. Total earnings from influencer wallets
    const earningsAggregation = await InfluencerWallet.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
        },
      },
    ]);
    const totalEarnings = earningsAggregation[0]?.totalEarnings || 0;

    return res.status(200).json({
      success: true,
      message: 'Affiliate statistics fetched successfully.',
      data: {
        totalAffiliates,
        pendingRequests,
        totalReferredUsers,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error('Error in getAffiliateStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getPendingAffiliateRequests = async (req, res) => {
  try {
    const pendingUsers = await userModel.find({
      role: 'influencer',
      influencerStatus: 'inactive',
    }).select('-password'); // Exclude password for security

    return res.status(200).json({
      success: true,
      message: 'Pending affiliate requests fetched successfully.',
      data: pendingUsers,
    });
  } catch (error) {
    console.error('Error fetching pending affiliate requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const approveAffiliateRequest = async (req, res) => {
  try {
    const { error, value } = approveAffiliateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { influencer } = value;

    const user = await userModel.findOneAndUpdate(
      { _id: influencer, role: 'influencer' },
      { influencerStatus: 'active' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or not an influencer' });
    }

    return res.status(200).json({
      success: true,
      message: 'Influencer status updated to active.',
      data: user
    });
  } catch (err) {
    console.error('Error updating influencer status:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const toggleReferralStatus = async (req, res) => {
  try {
    const { error, value } = toggleReferralStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { influencer, isActive } = value;

    const referral = await influencerReferralModel.findOne({ influencer: influencer });
    if (!referral) {
      return res.status(400).json({ success: false, message: 'Referral not found.' });
    }

    referral.isActive = isActive;
    referral.disabledBy = isActive ? null : 'admin';

    await referral.save();

    return res.status(200).json({
      success: true,
      message: `Referral ${isActive ? 'enabled' : 'disabled'} successfully.`,
      data: referral,
    });
  } catch (err) {
    console.error('Error toggling referral status:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateInfluencerRate = async (req, res) => {
  try {
    const { error, value } = influencerRateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { user, influencerRate } = value;

    const influencer = await userModel.findByIdAndUpdate(
      user,
      { influencerRate },
      { new: true }
    ).select('-password');

    if (!influencer) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Influencer rate updated successfully.',
      data: influencer,
    });
  } catch (err) {
    console.error('Error updating influencer rate:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateAllInfluencerRates = async (req, res) => {
  try {
    const { error, value } = allInfluencerRatesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { influencerRate } = value;

    // Update all users with role 'influencer'
    const result = await userModel.updateMany(
      { role: 'influencer' },
      { $set: { influencerRate } }
    );

    return res.status(200).json({
      success: true,
      message: `Influencers rate updated!.`,
    });
  } catch (err) {
    console.error('Error updating all influencer rates:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getAllPayoutRequests = async (req, res) => {
  try {

    const payoutRequests = await PayoutRequest.find()
      .populate('influencer', 'name email.value')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All payout requests fetched successfully',
      data: payoutRequests,
    });

  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching payout requests',
      error: error.message,
    });
  }
};

const handlePayoutRequest = async (req, res) => {
  try {
    const { error, value } = payoutActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { payoutRequestId, action } = value;

    const payoutRequest = await PayoutRequest.findById(payoutRequestId);
    if (!payoutRequest) {
      return res.status(404).json({ success: false, message: 'Payout request not found' });
    }

    if (payoutRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Payout already ${payoutRequest.status}` });
    }

    const influencerId = payoutRequest.influencer;
    const amount = payoutRequest.amount;

    if (action === 'reject') {
      await InfluencerWallet.findOneAndUpdate(
        { influencer: influencerId },
        { $inc: { amount } },
        { new: true }
      );

      payoutRequest.status = 'rejected';
      await payoutRequest.save();

      return res.status(200).json({
        success: true,
        message: 'Payout request rejected and amount refunded',
        data: payoutRequest
      });
    }

    // Approve case
    const influencer = await userModel.findById(influencerId);
    if (!influencer || !influencer.stripeConnectedAccount?.id) {
      return res.status(400).json({ success: false, message: 'Influencer does not have a connected Stripe account' });
    }

    const payoutResult = await sendPayoutToInfluencer(
      influencer.stripeConnectedAccount.id,
      amount,
      influencerId
    );

    if (!payoutResult.success) {
      return res.status(400).json({
        success: false,
        message: `Payout failed: ${payoutResult.message}`
      });
    }

    payoutRequest.status = 'approved';
    payoutRequest.transferId = payoutResult.transfer.id;
    payoutRequest.payoutId = payoutResult.payout.id;
    await payoutRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Payout approved and processed successfully',
      data: payoutRequest
    });

  } catch (error) {
    console.error('Error processing payout request:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while handling payout request',
      error: error.message
    });
  }
};

const createInfluencerGoal = async (req, res) => {
  try {
    // Validate input

    const { error } = influencerGoalschema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { totalReferrals, influencerRate } = req.body;

    const newGoal = new InfluencerGoal({ totalReferrals, influencerRate });
    await newGoal.save();

    return res.status(201).json({
      success: true,
      message: 'Influencer goal created successfully.',
      data: newGoal
    });

  } catch (error) {
    console.error('Error creating influencer goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getInfluencerGoal = async (req, res) => {
  try {
    // Fetch the latest goal (optional: you could fetch the first or all if needed)
    const goal = await InfluencerGoal.findOne().sort({ createdAt: -1 });

    if (!goal) {
      return res.status(200).json({
        success: true,
        message: 'No influencer goal found.',
        data: {}
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Influencer goal fetched successfully.',
      data: goal
    });
  } catch (error) {
    console.error('Error fetching influencer goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getGoalAchievers = async (req, res) => {
  try {
    // 1. Get the latest influencer goal
    const goal = await InfluencerGoal.findOne().sort({ createdAt: -1 });

    if (!goal) {
      return res.status(400).json({
        success: false,
        message: 'No goal found',
      });
    }

    const { totalReferrals } = goal;

    // 2. Aggregate influencers who meet or exceed the goal
    const achievers = await userModel.aggregate([
      {
        $match: {
          role: 'influencer'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'influencerRef',
          as: 'referredUsers'
        }
      },
      {
        $addFields: {
          referredCount: { $size: '$referredUsers' }
        }
      },
      {
        $match: {
          referredCount: { $gte: totalReferrals }
        }
      },
      {
        $project: {
          password: 0,
          referredUsers: 0
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Goal achievers fetched successfully',
      goal: totalReferrals,
      count: achievers.length,
      data: achievers
    });

  } catch (error) {
    console.error('Error in getGoalAchievers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateInfluencerGoal = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error } = updateInfluencerGoalschema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Update only the provided fields
    const updateData = {};
    if (req.body.totalReferrals !== undefined) {
      updateData.totalReferrals = req.body.totalReferrals;
    }
    if (req.body.influencerRate !== undefined) {
      updateData.influencerRate = req.body.influencerRate;
    }

    const updatedGoal = await InfluencerGoal.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedGoal) {
      return res.status(400).json({ success: false, message: 'Influencer goal not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Influencer goal updated successfully.',
      data: updatedGoal
    });

  } catch (error) {
    console.error('Error updating influencer goal:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getReferredUsers = async (req, res) => {
  try {
    const { influencerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(influencerId)) {
      return res.status(400).json({ message: 'Invalid influencer ID.' });
    }

    const referredUsers = await userModel.find({
      influencerRef: influencerId,
    });

    return res.status(200).json({
      message: 'Referred users fetched successfully.',
      data: referredUsers,
    });
  } catch (error) {
    console.error('Error fetching referred users:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const getAffiliateGoal = async (req, res) => {
  try {
    let goal = await AffiliateGoal.findOne();

    if (!goal) {
      goal = await AffiliateGoal.create({});
    }

    res.status(200).json({
      success: true,
      message: "Affiliate goal fetched successfully.",
      data: goal,
    });
  } catch (error) {
    console.log("Error fetching affiliate goal:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

const updateAffiliateGoal = async (req, res) => {
  try {
    const { error } = updateAffiliateGoalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { totalReferrals, influencerRate } = req.body;

    let goal = await AffiliateGoal.findOne();

    if (!goal) {
      goal = await AffiliateGoal.create({
        totalReferrals: totalReferrals || 0,
        influencerRate: influencerRate || 0,
      });
    } else {
      if (totalReferrals !== undefined) goal.totalReferrals = totalReferrals;
      if (influencerRate !== undefined) goal.influencerRate = influencerRate;
      await goal.save();
    }

    res.status(200).json({
      success: true,
      message: "Affiliate goal updated successfully.",
      data: goal,
    });
  } catch (error) {
    console.log("Error updating affiliate goal:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

export {
  getInfluencerSettings,
  updateInfluencerSettings,
  getInfluencerRateSettings,
  updateInfluencerRateSettings,
  toggleReferralStatus,
  getAllInfluencers,
  getAffiliateStats,
  getPendingAffiliateRequests,
  approveAffiliateRequest,
  updateInfluencerRate,
  updateAllInfluencerRates,
  getAllPayoutRequests,
  handlePayoutRequest,
  createInfluencerGoal,
  getInfluencerGoal,
  updateInfluencerGoal,
  getGoalAchievers,
  getReferredUsers,
  getAffiliateGoal,
  updateAffiliateGoal
};