import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import forgotPasswordModel from './forgotPasswordModel.js';
import verifyEmailModel from './verifyEmailModel.js';
import verifyPhoneNumberModel from './verifyPhoneNumberModel.js';
import updatePhoneNumberModel from './updatePhoneNumberModel.js';
import notificationModel from './notificationModel.js';
import productModel from './productModel.js';
import serviceModel from './serviceModel.js';
import productCategoryModel from './productCategoryModel.js';
import wishlistProductModel from './wishlistProductModel.js';
import wishlistServiceModel from './wishlistServiceModel.js';
import cartProductModel from './cartProductModel.js';
import productReviewModel from './productReviewModel.js';
import emailSupportRequestModel from './emailSupportRequestModel.js';
import homeScreenSearchProductHistoryModel from './homeScreenSearchProductHistoryModel.js';
import orderProductTransientModel from './orderProductTransientModel.js';
import orderProductPurchasedModel from './orderProductPurchasedModel.js';
import chatBlockedModel from './chatBlockedModel.js';
import homeScreenSearchServiceHistoryModel from './homeScreenSearchServiceHistoryModel.js';
import {
  addressSchema,
  avgProductRatingSchema,
  pushNotificationOptionsSchema,
  pushNotificationTokenSchema,
  subscriptionPlanSchema,
  stripeCustomerSchema,
  stripeConnectedAccountSchema
} from './schemas/index.js';
import {
  generateOTP,
  saveFile,
  sendEmail,
  sendNotification,
  sendSMS,
  throwError,
} from '../utils/index.js';
import { formatOrderProductProducts, productPickupAddress } from '../helpers/index.js';
import reportedUserModel from './reportedUserModel.js';
import { createConnectedAccount, createCustomer, createPaymentIntentCard, createSubscription, createTransfer, customerAttachCard, cancelSubscription as stripeCancelSubscription, detachPaymentMethod, paySubscriptionCard, updateConnectedAccount, changeSubscription } from '../stripe/index.js';
import transactionHistoryModel from './transactionHistoryModel.js';
import { verifySubscription as verifyAppleSubscription, verifyProduct as verifyAppleProduct } from '../inAppPurchases/apple/index.js';
import { acknowledgeSubscription, verifySubscription as verifyGoogleSubscription, verifyProduct as verifyGoogleProduct, consumeProduct, cancelSubscription } from '../inAppPurchases/google/index.js';
import fundsAddedToWalletModel from './fundsAddedToWalletModel.js';
import productBoostStripeModel from './productBoostStripeModel.js';
import serviceBoostStripeModel from './serviceBoostStripeModel.js';
import productAndSubscriptionRevenueModel from './productAndSubscriptionRevenueModel.js';
import stripeProfitsModel from './stripeProfitsModel.js';
import subscriptionStripeModel from './subscriptionStripeModel.js';
import stripeConnectedAccountIssuesModel from './stripeConnectedAccountIssuesModel.js';
import InfluencerSettings from './influencerSettingsModel.js';
import ReferralReward from './ReferralRewardModel.js';
import InfluencerWallet from './influencerWalletModel.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      value: {
        type: String,
        default: null
      },
      verified: {
        type: Boolean,
        default: true,
      },
    },
    phoneNumber: {
      code: {
        type: String,
        default: null
      },
      value: {
        type: String,
        default: null
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    appleAuthId: {
      type: String,
      default: null
    },
    googleAuthId: {
      type: String,
      default: null
    },
    facebookAuthId: {
      type: String,
      default: null
    },
    stripeConnectedAccount: {
      type: stripeConnectedAccountSchema,
      default: () => ({})
    },
    stripeCustomer: {
      type: stripeCustomerSchema,
      default: () => ({})
    },
    identityVerified: {
      type: Boolean,
      default: false,
    },
    subscriptionPlan: {
      type: subscriptionPlanSchema,
      default: () => ({})
    },
    password: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    address: {
      type: addressSchema,
      default: () => ({})
    },
    pickupAddress: {
      type: addressSchema,
      default: () => ({})
    },
    deliveryAddresses: {
      type: [addressSchema],
      default: [],
    },
    avgProductRating: {
      type: avgProductRatingSchema,
      default: () => ({})
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    pushNotificationOptions: {
      type: pushNotificationOptionsSchema,
      default: () => ({})
    },
    pushNotificationTokens: {
      type: [pushNotificationTokenSchema],
      default: [],
    },
    role: {
      type: String,
      enum: ['admin', 'client', 'influencer'],
      default: 'client',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
    },
    influencerRate: {
      type: Number,
      default: 5,
    },
    influencerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null
    },
    influencerStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    adminStatus: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    }
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { 'email.value': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'email.value': { $type: 'string' },
    },
  }
);

userSchema.index(
  { 'phoneNumber.code': 1, 'phoneNumber.value': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'phoneNumber.code': { $type: 'string' },
      'phoneNumber.value': { $type: 'string' },
    },
  }
);

userSchema.index(
  { appleAuthId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      appleAuthId: { $type: 'string' },
    },
  }
);

userSchema.index(
  { googleAuthId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleAuthId: { $type: 'string' },
    },
  }
);

userSchema.index(
  { facebookAuthId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      facebookAuthId: { $type: 'string' },
    },
  }
);

userSchema.index(
  { 'stripeConnectedAccount.id': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'stripeConnectedAccount.id': { $type: 'string' },
    },
  }
);

userSchema.index(
  { 'stripeCustomer.id': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'stripeCustomer.id': { $type: 'string' },
    },
  }
);

userSchema.index(
  { 'stripeCustomer.paymentMethod.id': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'stripeCustomer.paymentMethod.id': { $type: 'string' },
    },
  }
);

userSchema.statics.emailPasswordSignUp = async function (
  name,
  email,
  phoneNumber,
  password,
  role,
  influencerRef
) {

  const existingEmail = await this.findOne({ 'email.value': email });

  if (existingEmail) {
    if (!existingEmail.appleAuthId && !existingEmail.googleAuthId && !existingEmail.facebookAuthId) {
      if (!existingEmail.email.verified || !existingEmail.phoneNumber.verified) {
        await this.deleteOne({ 'email.value': email });
        return this.emailPasswordSignUp(name, email, phoneNumber, password, role, influencerRef);
      }
    }

    if (existingEmail.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    if (!existingEmail.password) {
      throwError(403, 'Please create a password.');
    }
    throwError(409, 'Another account is associated with this email address.');
  }

  const existingPhone = await this.findOne({
    'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value,
  });

  if (existingPhone) {
    if (!existingPhone.appleAuthId && !existingPhone.googleAuthId && !existingPhone.facebookAuthId) {
      if (!existingPhone.email.verified || !existingPhone.phoneNumber.verified) {
        await this.deleteOne({ 'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value });
        return this.emailPasswordSignUp(name, email, phoneNumber, password, role, influencerRef);
      }
    }
    throwError(409, 'Another account is associated with this phone number.');
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("roleee============", role);
  console.log("influencerRef============", influencerRef);

  let influencerStatus;
  if (role === 'influencer') {
    const settings = await InfluencerSettings.findOne() || await InfluencerSettings.create({});
    influencerStatus = settings.influencerStatus === 'auto' ? 'active' : 'inactive';
  }

  let influencerRefUserId = null;
  if (influencerRef) {
    const refUser = await this.findById(influencerRef);
    if (refUser) {
      influencerRefUserId = refUser._id;
    }
  }
  const newUser = new this({
    name,
    email: { value: email },
    password: hashedPassword,
    phoneNumber: { code: phoneNumber.code, value: phoneNumber.value },
    ...(role ? { role } : {}),
    ...(role === 'influencer' ? { influencerStatus } : {}),
    ...(influencerRefUserId ? { influencerRef: influencerRefUserId } : {}),
  });
  await newUser.save();

  return newUser._doc;
};

userSchema.statics.emailPasswordSignUpAdmin = async function (
  name,
  email,
  password,
  role,
) {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new this({
    name,
    email: { value: email },
    password: hashedPassword,
    role
  });
  await newUser.save();

  return newUser._doc;
};

userSchema.statics.emailPasswordLogIn = async function (email, password) {
  const existingUser = await this.findOne({ 'email.value': email });
  console.log("existingUser====", existingUser);

  if (!existingUser) {

    throwError(401, 'Invalid Credentials.');
  }

  if (existingUser.role !== 'client' && existingUser.role !== 'influencer') {

    throwError(401, 'Invalid Credentials.');
  }

  if (existingUser.status === 'deleted') {

    throwError(403, 'Your account has been deleted.');
  }

  if (!existingUser.password) {

    throwError(403, 'Please create a password.');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {

    throwError(401, 'Invalid Credentials.');
  }

  if (!existingUser.email.verified || !existingUser.phoneNumber.verified) {
    throwError(401, 'Invalid Credentials.');
  }

  return existingUser._doc;
};

userSchema.statics.emailPasswordLogInAdmin = async function (email, password) {
  const existingUser = await this.findOne({ 'email.value': email });

  if (!existingUser) {
    throwError(401, 'Invalid Credentials.');
  }

  if (existingUser.role !== 'admin') {
    throwError(401, 'Invalid Credentials.');
  }

  if (existingUser.status === 'deleted') {
    throwError(403, 'Your account has been deleted.');
  }

  if (!existingUser.password) {
    throwError(403, 'Please create a password.');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    throwError(401, 'Invalid Credentials.');
  }

  if (!existingUser.email.verified || !existingUser.phoneNumber.verified) {
    throwError(401, 'Invalid Credentials.');
  }
  return existingUser._doc;
};

userSchema.statics.appleLogin = async function (
  name,
  email,
  appleAuthId,
  profileImage
) {
  let existingUser = await this.findOne({ appleAuthId });
  if (existingUser) {
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  if (!email) {
    throwError(404, 'Email is required for first time.');
  }

  existingUser = await this.findOne({ 'email.value': email });
  if (existingUser) {
    existingUser.appleAuthId = appleAuthId;
    await existingUser.save();
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  const newUser = new this({
    name,
    email: { value: email, verified: true },
    appleAuthId,
    profileImage
  });
  await newUser.save();

  return newUser._doc;
};

userSchema.statics.googleLogin = async function (
  name,
  email,
  googleAuthId,
  profileImage
) {
  let existingUser = await this.findOne({ googleAuthId });
  if (existingUser) {
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  if (!email) {
    throwError(404, 'Email is required for first time.');
  }

  existingUser = await this.findOne({ 'email.value': email });
  if (existingUser) {
    existingUser.googleAuthId = googleAuthId;
    await existingUser.save();
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  const newUser = new this({
    name,
    email: { value: email, verified: true },
    googleAuthId,
    profileImage
  });
  await newUser.save();

  return newUser._doc;
};

userSchema.statics.facebookLogin = async function (
  name,
  email,
  facebookAuthId,
  profileImage
) {
  let existingUser = await this.findOne({ facebookAuthId });
  if (existingUser) {
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  if (!email) {
    throwError(404, 'Email is required for first time.');
  }

  existingUser = await this.findOne({ 'email.value': email });
  if (existingUser) {
    existingUser.facebookAuthId = facebookAuthId;
    await existingUser.save();
    if (existingUser.role !== 'client') {
      throwError(401, 'This is not a client account.');
    }
    if (existingUser.status === 'deleted') {
      throwError(403, 'Your account has been deleted.');
    }
    return existingUser._doc;
  }

  const newUser = new this({
    name,
    email: { value: email, verified: true },
    facebookAuthId,
    profileImage
  });
  await newUser.save();

  return newUser._doc;
};

userSchema.statics.forgotPasswordSendEmailOTP = async function (email) {
  const user = await this.findOne({ 'email.value': email });

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.status === 'deleted') {
    throwError(403, 'Your account has been deleted.');
  }

  const otp = generateOTP(4);
  await forgotPasswordModel.createOrUpdate(user._id, email, otp);
  await sendEmail.resetPassword(email, user.name, otp);
  return user._doc;
};

userSchema.statics.forgotPasswordVerifyEmailOTP = async function (email, otp) {
  const user = await this.findOne({ 'email.value': email });

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.status === 'deleted') {
    throwError(403, 'Your account has been deleted.');
  }
  await forgotPasswordModel.verifyOTP(user._id, email, otp);
  return user._doc;
};

userSchema.statics.forgotPasswordUpdatePassword = async function (
  email,
  password
) {
  const user = await this.findOne({ 'email.value': email });

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.status === 'deleted') {
    throwError(403, 'Your account has been deleted.');
  }

  const document = await forgotPasswordModel.findOne({ user: user._id, email: email });
  if (!document) {
    throwError(404, 'Please verify OTP first.');
  }

  if (document.expiry < new Date()) {
    throwError(400, 'OTP has expired.');
  }

  if (!document.verified) {
    throwError(404, 'Please verify OTP first.');
  }
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const updatedDocument = await this.findOneAndUpdate(
    {
      'email.value': email,
    },
    {
      $set: {
        password: hashedPassword,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedDocument) {
    throwError(404, 'User not found.');
  }

  return updatedDocument._doc;
};

//authorized routes
userSchema.statics.verifyEmailSendEmailOTP = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.email.value) {
    throwError(404, 'User does not have an email.');
  }

  const otp = generateOTP(4);
  await verifyEmailModel.createOrUpdate(_id, user.email.value, otp);
  await sendEmail.verifyEmail(user.email.value, user.name, otp);
  return user._doc;
};

userSchema.statics.verifyEmailVerifyEmailOTP = async function (_id, otp) {
  let user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.email.value) {
    throwError(404, 'User does not have an email.');
  }

  await verifyEmailModel.verifyOTP(_id, user.email.value, otp);
  user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'email.verified': true,
      },
    },
    {
      new: true,
    }
  );

  return user._doc;
};

userSchema.statics.verifyPhoneNumberSendSMSOTP = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.phoneNumber.code && !user.phoneNumber.value) {
    throwError(404, 'User does not have a phone number.');
  }

  if (!user.phoneNumber.code) {
    throwError(404, 'User phone number code is not set.');
  }

  if (!user.phoneNumber.value) {
    throwError(404, 'User phone number value is not set.');
  }

  const otp = generateOTP(4);
  await verifyPhoneNumberModel.createOrUpdate(_id, user.phoneNumber, otp);
  await sendSMS.verifyPhoneNumber(user.phoneNumber, otp);
  return user._doc;
};

userSchema.statics.verifyPhoneNumberVerifySMSOTP = async function (_id, otp) {
  let user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.phoneNumber.code && !user.phoneNumber.value) {
    throwError(404, 'User does not have a phone number.');
  }

  if (!user.phoneNumber.code) {
    throwError(404, 'User phone number code is not set.');
  }

  if (!user.phoneNumber.value) {
    throwError(404, 'User phone number value is not set.');
  }

  await verifyPhoneNumberModel.verifyOTP(_id, user.phoneNumber, otp);
  user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'phoneNumber.verified': true,
      },
    },
    {
      new: true,
    }
  );

  return user._doc;
};

userSchema.statics.updateIdentityVerified = async function (_id) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        identityVerified: true,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.subscribeFreePlan = async function (_id) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (user.subscriptionPlan.name !== 'No Plan') {
      throwError(409, 'User already has a plan selected.');
    }

    const date = new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());

    user.subscriptionPlan.platform = 'none';
    user.subscriptionPlan.transactionId = null;
    user.subscriptionPlan.name = 'Free Plan';
    user.subscriptionPlan.availablePostings = 1;
    user.subscriptionPlan.availableBoosts = 0;
    user.subscriptionPlan.wishlistFeature = false;
    user.subscriptionPlan.purchasedAt = date;
    user.subscriptionPlan.renewedAt = null;
    user.subscriptionPlan.expiresAt = nextMonth;
    user.subscriptionPlan.status = 'active';

    await user.save({ session });
    await session.commitTransaction();
    await session.endSession();

    return user.subscriptionPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.subscribePaidPlanGoogle = async function (_id, purchaseToken, subscriptionId) {
  const data = await verifyGoogleSubscription(purchaseToken);

  const user = await this.findOne({ 'subscriptionPlan.transactionId': purchaseToken });
  if (user) {
    throwError(409, 'Purchase token already used.');
  }
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'subscriptionPlan.platform': 'google',
        'subscriptionPlan.transactionId': purchaseToken,
        'subscriptionPlan.name': data.name,
        'subscriptionPlan.availablePostings': data.availablePostings,
        'subscriptionPlan.availableBoosts': data.availableBoosts,
        'subscriptionPlan.wishlistFeature': data.wishlistFeature,
        'subscriptionPlan.purchasedAt': data.purchasedAt,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': data.expiresAt,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  await acknowledgeSubscription(purchaseToken, subscriptionId);

  await productAndSubscriptionRevenueModel.addPurchase(_id, 'google', purchaseToken, data.name, data.purchasedAt, null, data.expiresAt, data.price, null, 'subscription');

  return updatedUser;
};

userSchema.statics.unsubscribePaidPlanGoogle = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.subscriptionPlan.platform !== 'google') {
    throwError(409, 'User does not have a Google subscription.');
  }

  if (!user.subscriptionPlan.transactionId) {
    throwError(409, 'User does not have a paid subscription.');
  }

  let productId = null;
  switch (user.subscriptionPlan.name) {
    case 'No Plan':
      break;
    case 'Free Plan':
      break;
    case 'Basic Plan':
      productId = 'base1month';
      break;
    case 'Standard Plan':
      productId = 'standard1month';
      break;
    case 'Premium Plan':
      productId = 'premium1month';
      break;
  }

  await cancelSubscription(user.subscriptionPlan.transactionId, productId);

  await productAndSubscriptionRevenueModel.cancelPurchase(user.subscriptionPlan.transactionId);
};

userSchema.statics.subscribePaidPlanApple = async function (_id, receipt) {
  const data = await verifyAppleSubscription(receipt);

  const user = await this.findOne({ 'subscriptionPlan.transactionId': data.transactionId });
  if (user) {
    throwError(409, 'Receipt already used.');
  }

  const user2 = await this.findById(_id);
  if (!user2) {
    throwError(404, 'User not found.');
  }

  if (user2.subscriptionPlan.platform === 'apple') {
    throwError(409, 'User already subscribed to apple subscription.');
  }

  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'subscriptionPlan.platform': 'apple',
        'subscriptionPlan.transactionId': data.transactionId,
        'subscriptionPlan.name': data.name,
        'subscriptionPlan.availablePostings': data.availablePostings,
        'subscriptionPlan.availableBoosts': data.availableBoosts,
        'subscriptionPlan.wishlistFeature': data.wishlistFeature,
        'subscriptionPlan.purchasedAt': data.purchasedAt,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': data.expiresAt,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.addPurchase(_id, 'apple', data.transactionId, data.name, data.purchasedAt, null, data.expiresAt, data.price, null, 'subscription');

  return updatedUser;
};

userSchema.statics.updateAddress = async function (
  _id,
  streetAddress,
  apartment_suite,
  country,
  state,
  city,
  zipCode
) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'address.streetAddress': streetAddress,
        'address.apartment_suite': apartment_suite,
        'address.country': country,
        'address.state': state,
        'address.city': city,
        'address.zipCode': zipCode,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.updateProfileImage = async function (_id, file) {
  const url = await saveFile(`users/${_id}/profileImage/${v4()}`, file);
  await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        profileImage: url
      }
    },
    {
      new: true
    }
  );

  return url;
};

userSchema.statics.deleteProfileImage = async function (_id) {
  const user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        profileImage: ''
      }
    },
    {
      new: true
    }
  );

  return user;
};

userSchema.statics.updateName = async function (_id, name) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        name: name,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.updatePhoneNumberSendSMSOTP = async function (
  _id,
  phoneNumber
) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.phoneNumber?.code == phoneNumber.code && user.phoneNumber?.value == phoneNumber.value) {
    throwError(409, 'This phone number is already registered for your account.');
  }

  const phoneNumberExists = await this.findOne({ 'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value });

  if (phoneNumberExists) {
    throwError(409, 'Another account is associated with this phone number.');
  }

  const otp = generateOTP(4);
  await updatePhoneNumberModel.createOrUpdate(_id, phoneNumber, otp);
  await sendSMS.updatePhoneNumber(phoneNumber, otp);
  return user._doc;
};

userSchema.statics.updatePhoneNumberVerifySMSOTP = async function (
  _id,
  phoneNumber,
  otp
) {
  let user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.phoneNumber?.code == phoneNumber.code && user.phoneNumber?.value == phoneNumber.value) {
    throwError(409, 'This phone number is already registered for your account.');
  }

  const phoneNumberExists = await this.findOne({ 'phoneNumber.code': phoneNumber.code, 'phoneNumber.value': phoneNumber.value });

  if (phoneNumberExists) {
    throwError(409, 'Another account is associated with this phone number.');
  }

  await updatePhoneNumberModel.verifyOTP(_id, phoneNumber, otp);

  user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'phoneNumber.code': phoneNumber.code,
        'phoneNumber.value': phoneNumber.value,
        'phoneNumber.verified': true,
      },
    },
    {
      new: true,
    }
  );

  return user._doc;
};

userSchema.statics.createPassword = async function (_id, password) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.password) {
    throwError(409, 'Your password is already created.');
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;
  user.save();
  return user._doc;
};

userSchema.statics.updatePassword = async function (
  _id,
  currentPassword,
  newPassword
) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const existingUser = await this.findById(_id).session(session);

    if (!existingUser) {
      throwError(404, 'User not found.');
    }

    if (!existingUser.password) {
      throwError(403, 'Please create a password.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );

    if (!isCurrentPasswordValid) {
      throwError(401, 'Current password is incorrect.');
    }

    const salt = await bcrypt.genSalt();
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    existingUser.password = hashedNewPassword;
    await existingUser.save({ session });
    await session.commitTransaction();
    await session.endSession();
    return existingUser._doc;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.updatePickupAddress = async function (
  _id,
  streetAddress,
  apartment_suite,
  country,
  state,
  city,
  zipCode
) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'pickupAddress.streetAddress': streetAddress,
        'pickupAddress.apartment_suite': apartment_suite,
        'pickupAddress.country': country,
        'pickupAddress.state': state,
        'pickupAddress.city': city,
        'pickupAddress.zipCode': zipCode,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.deletePickupAddress = async function (_id) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'pickupAddress.streetAddress': '',
        'pickupAddress.apartment_suite': '',
        'pickupAddress.country': '',
        'pickupAddress.state': '',
        'pickupAddress.city': '',
        'pickupAddress.zipCode': '',
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.addDeliveryAddress = async function (
  _id,
  streetAddress,
  apartment_suite,
  country,
  state,
  city,
  zipCode
) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);

    if (!user) {
      throwError(404, 'User not found.');
    }

    if (user.deliveryAddresses.length >= 3) {
      throwError(403, 'Max 3 delivery addresses allowed.');
    }

    user.deliveryAddresses.push({
      streetAddress,
      apartment_suite,
      country,
      state,
      city,
      zipCode,
    });

    await user.save({ session });

    await session.commitTransaction();
    await session.endSession();

    return user._doc;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.updateDeliveryAddress = async function (
  _id,
  addressId,
  streetAddress,
  apartment_suite,
  country,
  state,
  city,
  zipCode
) {
  const updatedUser = await this.findOneAndUpdate(
    {
      _id,
      'deliveryAddresses._id': addressId,
    },
    {
      $set: {
        'deliveryAddresses.$.streetAddress': streetAddress,
        'deliveryAddresses.$.apartment_suite': apartment_suite,
        'deliveryAddresses.$.country': country,
        'deliveryAddresses.$.state': state,
        'deliveryAddresses.$.city': city,
        'deliveryAddresses.$.zipCode': zipCode,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found or address Id not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.deleteDeliveryAddress = async function (_id, addressId) {
  const updatedUser = await this.findOneAndUpdate(
    {
      _id,
      deliveryAddresses: {
        $elemMatch: {
          _id: addressId,
        },
      },
    },
    {
      $pull: {
        deliveryAddresses: { _id: addressId },
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found or address Id not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.updatePushNotificationOptions = async function (
  _id,
  chatMessages,
  boostedProductsAndServices,
  wishlistItems,
  customerSupport,
) {
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'pushNotificationOptions.chatMessages': chatMessages,
        'pushNotificationOptions.boostedProductsAndServices': boostedProductsAndServices,
        'pushNotificationOptions.wishlistItems': wishlistItems,
        'pushNotificationOptions.customerSupport': customerSupport,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.addPushNotificationToken = async function (
  _id,
  platform,
  token
) {
  const updatedUser = await this.findOneAndUpdate(
    {
      _id,
      pushNotificationTokens: {
        $not: {
          $elemMatch: {
            platform: platform,
            token: token,
          },
        },
      },
    },
    {
      $push: {
        pushNotificationTokens: { platform, token },
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(409, 'User not found or token already exists.');
  }

  return updatedUser._doc;
};

userSchema.statics.deletePushNotificationToken = async function (
  _id,
  platform,
  token
) {
  const updatedUser = await this.findOneAndUpdate(
    {
      _id,
      pushNotificationTokens: {
        $elemMatch: {
          platform: platform,
          token: token,
        },
      },
    },
    {
      $pull: {
        pushNotificationTokens: { platform, token },
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found or token not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.getProfile = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  return user;
};

userSchema.statics.getUserProfile = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  return user;
};

userSchema.statics.getTransactionHistory = async function (_id, page) {
  const transactionHistory = await transactionHistoryModel.getUserTransactionHistory(_id, page);
  return transactionHistory;
};

userSchema.statics.getNotifications = async function (_id, page) {
  const notifications = await notificationModel.getUserNotifications(_id, page);
  return notifications;
};

userSchema.statics.markNotificationsViewed = async function (_id) {
  await notificationModel.markAllUserNotificationsViewed(_id);
};

userSchema.statics.createReport = async function (reporter, reportedUser, type, selectedReason, otherReason) {
  const user1 = await this.findById(reporter);
  if (!user1) {
    throwError(404, 'Reporter not found.');
  }

  const user2 = await this.findById(reportedUser);
  if (!user2) {
    throwError(404, 'Reported user not found.');
  }

  const data = await reportedUserModel.createReport(reporter, reportedUser, type, selectedReason, otherReason);
  return data;
};

userSchema.statics.activateUser = async function (_id) {
  const tempUser = await this.findById(_id);
  if (!tempUser) {
    throwError(404, 'User not found.');
  }

  if (tempUser.status === 'active') {
    throwError(409, 'User account is already activate.');
  }

  const user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        status: 'active'
      }
    },
    { new: true }
  );
  return user;
};

userSchema.statics.getListingsVisibleCount = async function (_id) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.status === 'inactive' || user.adminStatus === 'blocked') {
    return 0;
  }

  const products = await productModel.find({ seller: _id, status: 'active', adminStatus: 'active' });
  const services = await serviceModel.find({ seller: _id, status: 'active' });

  const total = products.length + services.length;

  return total;
};

userSchema.statics.deactivateUser = async function (_id) {
  const tempUser = await this.findById(_id);
  if (!tempUser) {
    throwError(404, 'User not found.');
  }
  if (tempUser.status === 'inactive') {
    throwError(409, 'User already deactivated his account.');
  }

  const user = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        status: 'inactive'
      }
    },
    { new: true }
  );
  return user;
};

userSchema.statics.deleteUser = async function (_id, password) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);

    if (!user) {
      throwError(404, 'User not found.');
    }

    // if (user.password) {
    //   if (!password) {
    //     throwError(404, 'Password is required.');
    //   }
    //   const isPasswordValid = await bcrypt.compare(password, user.password);
    //   if (!isPasswordValid) {
    //     throwError(409, 'Password does not match.');
    //   }
    // }

    if (user.subscriptionPlan.name !== 'No Plan' && user.subscriptionPlan.name !== 'Free Plan') {
      throwError(409, 'User has an active subscription.');
    }

    if (user.walletBalance !== 0) {
      throwError(409, 'User has balance in his wallet.');
    }

    const orderPurchased = await orderProductPurchasedModel.getUserOrderProductPurchasedCurrent(_id);
    if (orderPurchased.length) {
      throwError(409, 'User has current orders placed.');
    }

    const orderReceived = await orderProductPurchasedModel.getUserOrderProductReceivedCurrent(_id);
    if (orderReceived.length) {
      throwError(409, 'User has current orders received.');
    }

    user.status = 'deleted';
    await user.save({ session });

    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }

  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        status: 'deleted',
      },
    },
    {
      new: true,
    }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }

  return updatedUser._doc;
};

userSchema.statics.createEmailSupportRequest = async function (_id, title, description) {
  const emailSupportRequest = await emailSupportRequestModel.createEmailSupportRequest(_id, title, description);
  return emailSupportRequest;
};

userSchema.statics.getProduct = async function (_id, productId) {
  const categoryProducts = await productModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId)
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
  ]);

  if (!categoryProducts?.length) {
    throwError(404, 'Product not found.');
  }

  if (_id) {
    const wishlist = await wishlistProductModel.getUserWishlistProductsAll(_id);
    const wishlistProductIds = wishlist.map(it => it.product.toString());

    const updatedCategoryProducts = categoryProducts.map(it => {
      if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
        return {
          ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: wishlistProductIds.includes(it._id.toString())
        };
      }
      return { ...it, isWishListed: wishlistProductIds.includes(it._id.toString()) };
    });

    return updatedCategoryProducts[0];
  } else {
    const updatedCategoryProducts = categoryProducts.map(it => {
      if (it.fulfillmentMethod.selfPickup && !it.pickupAddress) {
        return {
          ...it, pickupAddress: productPickupAddress(it.sellerDetails.pickupAddress), isWishListed: false
        };
      }
      return { ...it, isWishListed: false };
    });

    return updatedCategoryProducts[0];
  }
};

userSchema.statics.getService = async function (_id, servId) {
  const services = await serviceModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(servId)
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
  ]);

  if (_id) {
    const wishlist = await wishlistServiceModel.getUserWishlistServicesAll(_id);
    const wishlistServiceIds = wishlist.map(it => it.service.toString());

    const abc = services.map(it => ({ ...it, isWishListed: wishlistServiceIds.includes(it._id.toString()) }));
    return abc[0];
  } else {
    const abc = services.map(it => ({ ...it, isWishListed: false }));
    return abc[0];
  }
};

//chat routes
userSchema.statics.uploadChatAttachments = async function (_id, attachments) {
  const urls = [];
  const attachmentsPromises = attachments.map((item, index) => saveFile(`chat/attachments/${v4()}`, item));

  const attachmentsResults = await Promise.allSettled(attachmentsPromises);

  for (const x of attachmentsResults) {
    if (x.status !== 'fulfilled') {
      throwError(400, 'Images could not be uploaded successfully.');
    }
  }

  for (let i = 0; i < attachmentsResults.length; i++) {
    urls.push(attachmentsResults[i].value);
  }

  return urls;
};

userSchema.statics.getProfileDetails = async function (_id, userId) {
  const user = await this.findById(userId);

  if (!user) {
    throwError(404, 'User not found.');
  }

  return user;
};

userSchema.statics.chatBlockUser = async function (_id, blockedUserId) {
  const data = await chatBlockedModel.blockUser(_id, blockedUserId);
  return data;
};

userSchema.statics.sendChatMessageNotification = async function (senderId, receiverId, title, attachments, body) {
  const notification = await sendNotification.sendChatMessageNotification(senderId, receiverId, title, attachments, body);
  return notification;
};

userSchema.statics.sendCustomerSupportChatMessageNotification = async function (senderId, receiverId, title, attachments, body) {
  const notification = await sendNotification.sendCustomerSupportChatMessageNotification(senderId, receiverId, title, attachments, body);
  return notification;
};

//seller routes
userSchema.statics.addProduct = async function (
  _id,
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
  moderationStatus,
  moderationReason
) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.subscriptionPlan.availablePostings <= 0) {
    throwError(409, 'You do not have any postings left.');
  }

  const product = await productModel.addUserProduct(
    _id,
    user.pickupAddress,
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
    moderationStatus,
    moderationReason
  );

  return product;
};

userSchema.statics.productBoostFreePlan = async function (_id, productId) {
  const session = await mongoose.startSession();
  const date = new Date();
  const sevenDaysLater = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    if (user.subscriptionPlan.availableBoosts <= 0) {
      throwError(409, 'User does not have any free boosts available.');
    }
    const product = await productModel.findById(productId).session(session);
    if (!product) {
      throwError(404, 'Product not found.');
    }
    if (!product.seller.equals(_id)) {
      throwError(409, 'User does not own this product.');
    }
    if (product.status !== 'active') {
      throwError(409, 'Product is not active.');
    }
    if (product.adminStatus === 'blocked') {
      throwError(409, 'Product has been blocked by admin.');
    }
    if (product.boostPlan.name !== 'No Plan') {
      throwError(409, 'Product is already boosted.');
    }

    user.subscriptionPlan.availableBoosts -= 1;
    product.boostPlan.transactionId = null;
    product.boostPlan.name = 'Free Plan';
    product.boostPlan.purchasedAt = date;
    product.boostPlan.expiresAt = sevenDaysLater;

    await user.save({ session });
    await product.save({ session });

    await session.commitTransaction();
    await session.endSession();

    return product.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.productBoostPaidPlanGoogle = async function (_id, prodId, purchaseToken, productId) {
  const data = await verifyGoogleProduct(purchaseToken, productId);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    const product = await productModel.findById(prodId).session(session);
    if (!product) {
      throwError(404, 'Product not found.');
    }
    if (!product.seller.equals(_id)) {
      throwError(409, 'User does not own this product.');
    }
    if (product.status !== 'active') {
      throwError(409, 'Product is not active.');
    }
    if (product.adminStatus === 'blocked') {
      throwError(409, 'Product has been blocked by admin.');
    }
    if (product.boostPlan.name !== 'No Plan') {
      throwError(409, 'Product is already boosted.');
    }

    product.boostPlan.transactionId = purchaseToken;
    product.boostPlan.name = data.name;
    product.boostPlan.purchasedAt = data.purchasedAt;
    product.boostPlan.expiresAt = data.expiresAt;

    const purchaseTicket = new productAndSubscriptionRevenueModel({
      user: _id,
      platform: 'google',
      transactionId: purchaseToken,
      name: data.name,
      purchasedAt: data.purchasedAt,
      renewedAt: null,
      expiresAt: data.expiresAt,
      price: data.price,
      cancelledAt: null,
      type: 'product',
    });

    await purchaseTicket.save({ session });

    await product.save({ session });
    await consumeProduct(purchaseToken, productId);

    await session.commitTransaction();
    await session.endSession();

    return product.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.productBoostPaidPlanApple = async function (_id, prodId, receipt) {
  const data = await verifyAppleProduct(receipt);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    const product = await productModel.findById(prodId).session(session);
    if (!product) {
      throwError(404, 'Product not found.');
    }
    if (!product.seller.equals(_id)) {
      throwError(409, 'User does not own this product.');
    }
    if (product.status !== 'active') {
      throwError(409, 'Product is not active.');
    }
    if (product.adminStatus === 'blocked') {
      throwError(409, 'Product has been blocked by admin.');
    }
    if (product.boostPlan.name !== 'No Plan') {
      throwError(409, 'Product is already boosted.');
    }

    product.boostPlan.transactionId = data.transactionId;
    product.boostPlan.name = data.name;
    product.boostPlan.purchasedAt = data.purchasedAt;
    product.boostPlan.expiresAt = data.expiresAt;

    const purchaseTicket = new productAndSubscriptionRevenueModel({
      user: _id,
      platform: 'apple',
      transactionId: data.transactionId,
      name: data.name,
      purchasedAt: data.purchasedAt,
      renewedAt: null,
      expiresAt: data.expiresAt,
      price: data.price,
      cancelledAt: null,
      type: 'product',
    });

    await purchaseTicket.save({ session });

    await product.save({ session });

    await session.commitTransaction();
    await session.endSession();

    return product.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.updateProduct = async function (_id, productId, price, quantity) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const product = await productModel.updateUserProduct(_id, user.pickupAddress, productId, price, quantity);

  return product;
};

userSchema.statics.deleteProduct = async function (_id, productId) {
  const product = await productModel.deleteUserProduct(_id, productId);
  return product;
};

userSchema.statics.getProducts = async function (_id, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const products = await productModel.getUserProducts(_id, user.pickupAddress, page);

  return products;
};

userSchema.statics.getProductsBoosted = async function (_id, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const products = await productModel.getUserProductsBoosted(_id, user.pickupAddress, page);

  return products;
};

userSchema.statics.getSearchedProducts = async function (_id, name, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const products = await productModel.getUserSearchedProducts(_id, user.pickupAddress, name, page);

  return products;
};

userSchema.statics.getSearchedProductsBoosted = async function (_id, name, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const products = await productModel.getUserSearchedProductsBoosted(_id, user.pickupAddress, name, page);

  return products;
};

userSchema.statics.addService = async function (
  _id,
  images,
  displayImageIndex,
  name,
  description,
  country,
  state,
  city,
  price,
  moderationStatus,
  moderationReason
) {

  const user = await this.findById(_id);

  if (user.subscriptionPlan.availablePostings <= 0) {
    throwError(409, 'You do not have any postings left.');
  }

  const service = serviceModel.addUserService(
    _id,
    images,
    displayImageIndex,
    name,
    description,
    country,
    state,
    city,
    price,
    moderationStatus,
    moderationReason
  );

  return service;
};

userSchema.statics.serviceBoostFreePlan = async function (_id, serviceId) {
  const session = await mongoose.startSession();
  const date = new Date();
  const sevenDaysLater = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    if (user.subscriptionPlan.availableBoosts <= 0) {
      throwError(409, 'User does not have any free boosts available.');
    }
    const service = await serviceModel.findById(serviceId).session(session);
    if (!service) {
      throwError(404, 'Service not found.');
    }
    if (!service.seller.equals(_id)) {
      throwError(409, 'User does not own this service.');
    }
    if (service.status !== 'active') {
      throwError(409, 'service is not active.');
    }
    if (service.boostPlan.name !== 'No Plan') {
      throwError(409, 'service is already boosted.');
    }

    user.subscriptionPlan.availableBoosts -= 1;
    service.boostPlan.transactionId = null;
    service.boostPlan.name = 'Free Plan';
    service.boostPlan.purchasedAt = date;
    service.boostPlan.expiresAt = sevenDaysLater;

    await user.save({ session });
    await service.save({ session });

    await session.commitTransaction();
    await session.endSession();

    return service.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.serviceBoostPaidPlanGoogle = async function (_id, serviceId, purchaseToken, productId) {
  const data = await verifyGoogleProduct(purchaseToken, productId);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    const service = await serviceModel.findById(serviceId).session(session);
    if (!service) {
      throwError(404, 'Service not found.');
    }
    if (!service.seller.equals(_id)) {
      throwError(409, 'User does not own this service.');
    }
    if (service.status !== 'active') {
      throwError(409, 'service is not active.');
    }
    if (service.boostPlan.name !== 'No Plan') {
      throwError(409, 'service is already boosted.');
    }

    service.boostPlan.transactionId = purchaseToken;
    service.boostPlan.name = data.name;
    service.boostPlan.purchasedAt = data.purchasedAt;
    service.boostPlan.expiresAt = data.expiresAt;

    const purchaseTicket = new productAndSubscriptionRevenueModel({
      user: _id,
      platform: 'google',
      transactionId: purchaseToken,
      name: data.name,
      purchasedAt: data.purchasedAt,
      renewedAt: null,
      expiresAt: data.expiresAt,
      price: data.price,
      cancelledAt: null,
      type: 'product',
    });

    await purchaseTicket.save({ session });
    await service.save({ session });
    await consumeProduct(purchaseToken, productId);

    await session.commitTransaction();
    await session.endSession();

    return service.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.serviceBoostPaidPlanApple = async function (_id, serviceId, receipt) {
  const data = await verifyAppleProduct(receipt);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }
    const service = await serviceModel.findById(serviceId).session(session);
    if (!service) {
      throwError(404, 'Service not found.');
    }
    if (!service.seller.equals(_id)) {
      throwError(409, 'User does not own this service.');
    }
    if (service.status !== 'active') {
      throwError(409, 'Service is not active.');
    }
    if (service.boostPlan.name !== 'No Plan') {
      throwError(409, 'Service is already boosted.');
    }

    service.boostPlan.transactionId = data.transactionId;
    service.boostPlan.name = data.name;
    service.boostPlan.purchasedAt = data.purchasedAt;
    service.boostPlan.expiresAt = data.expiresAt;

    const purchaseTicket = new productAndSubscriptionRevenueModel({
      user: _id,
      platform: 'apple',
      transactionId: data.transactionId,
      name: data.name,
      purchasedAt: data.purchasedAt,
      renewedAt: null,
      expiresAt: data.expiresAt,
      price: data.price,
      cancelledAt: null,
      type: 'product',
    });

    await purchaseTicket.save({ session });

    await service.save({ session });

    await session.commitTransaction();
    await session.endSession();

    return service.boostPlan;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

// userSchema.statics.updateService = async function (_id, serviceId, newImages, parsedCurrentImages, displayImageIndex, name, description, country, state, city, price) {
//   const service = await serviceModel.updateUserService(_id, serviceId, newImages, parsedCurrentImages, displayImageIndex, name, description, country, state, city, price);
//   return service;
// };

userSchema.statics.updateService = async function (_id, serviceId, price) {
  const service = await serviceModel.updateUserService(_id, serviceId, price);
  return service;
};

userSchema.statics.deleteService = async function (_id, serviceId) {
  const service = await serviceModel.deleteUserService(_id, serviceId);
  return service;
};

userSchema.statics.getServices = async function (_id, page) {
  const services = await serviceModel.getUserServices(_id, page);
  return services;
};

userSchema.statics.getServicesBoosted = async function (_id, page) {
  const services = await serviceModel.getUserServicesBoosted(_id, page);
  return services;
};

userSchema.statics.getSearchedServices = async function (_id, name, page) {
  const services = await serviceModel.getUserSearchedServices(_id, name, page);
  return services;
};

userSchema.statics.getSearchedServicesBoosted = async function (_id, name, page) {
  const services = await serviceModel.getUserSearchedServicesBoosted(_id, name, page);
  return services;
};

userSchema.statics.getProductCategories = async function () {
  const productCategories = await productCategoryModel.getProductCategories();
  return productCategories;
};

//buyer routes
userSchema.statics.getHomeScreenProducts = async function (_id, filters) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  const products = await productModel.getHomeScreenProducts(_id, user.address, filters);

  return products;
};

userSchema.statics.getHomeScreenProductsGuestMode = async function () {
  const products = await productModel.getHomeScreenProductsGuestMode();

  return products;
};

userSchema.statics.getHomeScreenSearchedProducts = async function (_id, name, category, subCategory, page, city, state, lat, lng, radius) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  // const products = await productModel.getHomeScreenSearchedProducts(_id, user.address, name, category, subCategory, page, city, state, lat, lng, radius);
  const products = await productModel.getHomeScreenSearchedProductsGuestMode(name, category, subCategory, page);

  return products;
};

userSchema.statics.getHomeScreenSearchedProductsGuestMode = async function (name, category, subCategory, page) {
  const products = await productModel.getHomeScreenSearchedProductsGuestMode(name, category, subCategory, page);

  return products;
};

userSchema.statics.getHomeScreenSearchedProductsHistory = async function (_id) {
  const history = await homeScreenSearchProductHistoryModel.getUserHistory(_id);
  return history;
};

userSchema.statics.getHomeScreenServices = async function (_id, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const services = await serviceModel.getHomeScreenServices(_id, user.address, page);

  return services;
};

userSchema.statics.getHomeScreenServicesGuestMode = async function (page) {
  const services = await serviceModel.getHomeScreenServicesGuestMode(page);

  return services;
};

userSchema.statics.getHomeScreenSearchedServices = async function (_id, name, page) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  const services = await serviceModel.getHomeScreenSearchedServices(_id, user.address, name, page);

  return services;
};

userSchema.statics.getHomeScreenSearchedServicesGuestMode = async function (name, page) {
  const services = await serviceModel.getHomeScreenSearchedServicesGuestMode(name, page);

  return services;
};

userSchema.statics.getHomeScreenSearchedServicesHistory = async function (_id) {
  const history = await homeScreenSearchServiceHistoryModel.getUserHistory(_id);
  return history;
};

userSchema.statics.addCartProduct = async function (_id, productId, fulfillmentMethod) {
  const user = await this.findById(_id);
  const existingProduct = await productModel.findById(productId).populate('seller');

  if (!user) {
    throwError(404, 'User not found.');
  }
  if (!existingProduct) {
    throwError(404, 'Product not found.');
  }
  if (!existingProduct.seller) {
    throwError(404, 'Product seller not found.');
  }
  if (existingProduct.seller._id.equals(_id)) {
    throwError(409, 'User cannot add his own product to cart.');
  }
  if (existingProduct.seller.status !== 'active') {
    throwError(409, 'Product seller status is not active.');
  }
  if (existingProduct.seller.adminStatus !== 'active') {
    throwError(409, 'Product seller admin status is not active.');
  }
  if (existingProduct.country !== user.address.country) {
    throwError(409, 'User country does not match with product country.');
  }

  // if (existingProduct.state !== user.address.state) {
  //   throwError(409, 'User state does not match with product state.');
  // }
  // if (existingProduct.city !== user.address.city) {
  //   throwError(409, 'User city does not match with product city.');
  // }
  if (fulfillmentMethod.selfPickup && !existingProduct.fulfillmentMethod.selfPickup) {
    throwError(409, 'Self pickup is not available for this product.');
  }
  if (fulfillmentMethod.delivery && !existingProduct.fulfillmentMethod.delivery) {
    throwError(409, 'Delivery is not available for this product.');
  }
  if (existingProduct.status !== 'active') {
    throwError(409, 'Product status is not active.');
  }
  if (existingProduct.adminStatus !== 'active') {
    throwError(409, 'Product admin status is not active.');
  }

  const cartProduct = await cartProductModel.addUserCartProduct(_id, productId, fulfillmentMethod);

  return cartProduct;
};

userSchema.statics.updateCartProductIncrementByOne = async function (_id, productId) {
  const updatedCartProduct = await cartProductModel.updateUserCartProductIncrementByOne(_id, productId);
  return updatedCartProduct;
};

userSchema.statics.updateCartProductDecrementByOne = async function (_id, productId) {
  const updatedCartProduct = await cartProductModel.updateUserCartProductDecrementByOne(_id, productId);
  return updatedCartProduct;
};

userSchema.statics.deleteCartProduct = async function (_id, productId) {
  const deletedCartProduct = await cartProductModel.deleteUserCartProduct(_id, productId);
  return deletedCartProduct;
};

userSchema.statics.cartClearProduct = async function (_id) {
  const deletedCartProduct = await cartProductModel.deleteUserCart(_id);
  return deletedCartProduct;
};

userSchema.statics.getCartProducts = async function (_id) {
  const cartProducts = await cartProductModel.getUserCartProducts(_id);
  return cartProducts;
};

userSchema.statics.cartProductVerify = async function (_id) {
  await cartProductModel.userCartProductVerify(_id);
};

userSchema.statics.createOrderProductTransient = async function (_id, deliveryAddress, paymentMethod) {
  await orderProductTransientModel.restoreUserOrderProductTransient(_id);
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);
    if (!user) {
      throwError(404, 'User not found.');
    }

    const cartProductItems = await cartProductModel.find({ user: _id }).session(session);
    if (!cartProductItems || cartProductItems.length === 0) {
      throwError(404, 'No items found in cart.');
    }

    if (paymentMethod === 'Card') {
      if (!user.stripeCustomer.id || !user.stripeCustomer.paymentMethod.id || !user.stripeCustomer.paymentMethod.exp_month || !user.stripeCustomer.paymentMethod.exp_year || !user.stripeCustomer.paymentMethod.last4) {
        throwError(404, 'User card is not registered.');
      }
    }

    const products = [];

    for (const cartProductItem of cartProductItems) {
      const product = await productModel.findById(cartProductItem.product).populate('seller').session(session);
      if (!product) {
        throwError(404, 'Product not found.');
      }
      if (!product.seller) {
        throwError(404, `Seller not found for "${product.name}".`);
      }
      if (product.seller._id.equals(_id)) {
        throwError(404, `User cannot purchase his own product "${product.name}".`);
      }
      if (product.seller.status !== 'active') {
        throwError(409, `Product "${product.name}" seller status is not active.`);
      }
      if (product.seller.adminStatus !== 'active') {
        throwError(409, `Product "${product.name}" seller admin status is not active.`);
      }
      if (product.country !== user.address.country) {
        throwError(409, `User country does not match with product country for "${product.name}".`);
      }
      // if (product.state !== user.address.state) {
      //   throwError(409, `User state does not match with product state for "${product.name}".`);
      // }
      // if (product.city !== user.address.city) {
      //   throwError(409, `User city does not match with product city for "${product.name}"`);
      // }
      if (cartProductItem.fulfillmentMethod.selfPickup && !product.fulfillmentMethod.selfPickup) {
        throwError(409, `Self pickup is not available for product "${product.name}"`);
      }
      if (cartProductItem.fulfillmentMethod.delivery && !product.fulfillmentMethod.delivery) {
        throwError(409, `Delivery is not available for product "${product.name}"`);
      }
      if (cartProductItem.fulfillmentMethod.delivery) {
        if (!deliveryAddress?.streetAddress || !deliveryAddress?.country || !deliveryAddress?.state || !deliveryAddress?.city) {
          throwError(409, 'Please provide a complete delivery address.');
        }
      }
      if (cartProductItem.quantity > product.quantity) {
        throwError(409, `Only "${product.quantity}" quantity is available for "${product.name}"`);
      }
      if (product.status !== 'active') {
        throwError(409, `Product "${product.name}" status is not active.`);
      }
      if (product.adminStatus !== 'active') {
        throwError(409, `Product "${product.name}" admin status is not active.`);
      }

      product.quantity -= cartProductItem.quantity;
      product.quantitySold += cartProductItem.quantity;
      product.ordersReceived++;
      await product.save({ session });

      if (product.fulfillmentMethod.selfPickup && !product.pickupAddress) {
        products.push({ product: { ...product, pickupAddress: productPickupAddress(product.seller.pickupAddress) }, fulfillmentMethod: cartProductItem.fulfillmentMethod, quantity: cartProductItem.quantity });
      } else {
        products.push({ product, fulfillmentMethod: cartProductItem.fulfillmentMethod, quantity: cartProductItem.quantity });
      }
    }

    const orderProductTransient = new orderProductTransientModel({
      placer: _id,
      deliveryAddress,
      paymentMethod,
      stripeCustomer: {
        id: paymentMethod === 'Card' ? user.stripeCustomer.id : null,
        paymentMethod: {
          id: paymentMethod === 'Card' ? user.stripeCustomer.paymentMethod.id : null,
          exp_month: paymentMethod === 'Card' ? user.stripeCustomer.paymentMethod.exp_month : '',
          exp_year: paymentMethod === 'Card' ? user.stripeCustomer.paymentMethod.exp_year : '',
          last4: paymentMethod === 'Card' ? user.stripeCustomer.paymentMethod.last4 : ''
        }
      },
      platformFee: process.env.PLATFORM_FEE,
      products: products,
    });

    await orderProductTransient.save({ session });

    const formattedProducts = formatOrderProductProducts(orderProductTransient.products);

    await session.commitTransaction();
    await session.endSession();

    return {
      ...orderProductTransient.toObject(),
      products: formattedProducts
    };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.createOrderProductPurchased = async function (_id) {
  const receiverIds = [];
  const transfers = [];
  const productOutOfStock = [];
  let user = null;
  let paymentIntent = null;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    user = await this.findById(_id).session(session);
    const orderProductTransient = await orderProductTransientModel.findOne({ placer: _id }).populate('products.product.seller').session(session);

    if (!orderProductTransient) {
      throwError(404, 'User does not have a transient order.');
    }

    const currentTime = new Date();
    const timeLimit = new Date(orderProductTransient.createdAt.getTime() + 3 * 60 * 1000);
    if (currentTime > timeLimit) {
      throwError(409, 'Transient order purchasing threshold expired.');
    }

    const amount = orderProductTransient.products.reduce((sum, product) => sum + (product.product.price * product.quantity), 0);

    orderProductTransient.products.forEach(it => {
      const index = transfers.findIndex(it2 => it2.sellerId === it.product.seller._id);
      if (index !== -1) {
        transfers[index] = { sellerId: transfers[index].sellerId, connectedAccountId: transfers[index].connectedAccountId, amount: transfers[index].amount + (it.product.price * it.quantity) };
      } else {
        transfers.push({ sellerId: it.product.seller._id, connectedAccountId: it.product.seller.stripeConnectedAccount.id, amount: it.product.price * it.quantity });
      }
    });

    transfers.forEach(transfer => {
      transfer.amount -= (transfer.amount * orderProductTransient.platformFee).toFixed(2);
    });

    const formattedProducts = formatOrderProductProducts(orderProductTransient.products);

    if (orderProductTransient.paymentMethod === 'Card') {
      const a = await createPaymentIntentCard(amount, orderProductTransient.stripeCustomer.id, orderProductTransient.stripeCustomer.paymentMethod.id);
      orderProductTransient.paymentIntentId = a.paymentIntentId;
      await orderProductTransient.save({ session });

      paymentIntent = a;
    }

    else if (orderProductTransient.paymentMethod === 'Pay via wallet') {
      const profit = (amount * orderProductTransient.platformFee).toFixed(2);
      if (user.walletBalance < amount) {
        throwError(409, 'Not enough funds in wallet.');
      }

      const orderProductPurchased = new orderProductPurchasedModel({
        placer: orderProductTransient.placer,
        deliveryAddress: orderProductTransient.deliveryAddress,
        paymentMethod: orderProductTransient.paymentMethod,
        stripeCustomer: orderProductTransient.stripeCustomer,
        platformFee: orderProductTransient.platformFee,
        products: orderProductTransient.products
      });

      orderProductTransient.products.forEach(it => {
        if (!receiverIds.includes(it.product.seller._id.toString())) {
          receiverIds.push(it.product.seller._id.toString());
        }
        if (it.product.quantity === 0) {
          productOutOfStock.push({ product: it.product, boosted: it.product.boostPlan.name !== 'No Plan' });
        }
      });

      await orderProductPurchased.save({ session });
      await orderProductTransient.deleteOne({ session });
      await cartProductModel.deleteMany({ user: _id }).session(session);

      const promises = transfers.map(async (it) => {
        const seller = await this.findById(it.sellerId).session(session);
        seller.walletBalance += it.amount;
        seller.walletBalance = parseFloat(seller.walletBalance.toFixed(2));
        await seller.save({ session });
      });

      await Promise.all(promises);

      user.walletBalance -= amount;
      user.walletBalance = parseFloat(user.walletBalance.toFixed(2));
      await user.save({ session });
      const stpr = await stripeProfitsModel.findOneAndUpdate(
        {
          type: 'adminProfits'
        },
        {
          $inc: { value: profit }
        },
        { new: true, upsert: true, session }
      );
      stpr.value = stpr.value.toFixed(2);
      await stpr.save({ session });

      sendNotification.sendOrderReceivedNotification(_id, orderProductPurchased._id, receiverIds).catch(err => console.log(err));
      for (const product of productOutOfStock) {
        sendNotification.sendCommonNotificationSingleUser(null, product.product.seller._id, `${product.product.name} is out of stock`, [], `Your product ${product.product.name} is out of stock.`, { type: 'product out of stock', id: product.product._id.toString(), boosted: product.boosted }, product.product.seller.pushNotificationTokens, true).catch(err => console.log(err));
      }

    } else {
      throwError(409, 'User payment method is unknown.');
    }

    await session.commitTransaction();
    await session.endSession();

    return { ...orderProductTransient.toObject(), products: formattedProducts, walletBalance: user.walletBalance, total: amount, paymentIntent };

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.getOrderProductPurchasedCurrent = async function (_id) {
  const orders = await orderProductPurchasedModel.getUserOrderProductPurchasedCurrent(_id);
  return orders;
};

userSchema.statics.getOrderProductPurchasedPast = async function (_id, page) {
  const orders = await orderProductPurchasedModel.getUserOrderProductPurchasedPast(_id, page);
  return orders;
};

userSchema.statics.getOrderProductReceivedCurrent = async function (_id) {
  const orders = await orderProductPurchasedModel.getUserOrderProductReceivedCurrent(_id);
  return orders;
};

userSchema.statics.getOrderProductReceivedPast = async function (_id, page) {
  const orders = await orderProductPurchasedModel.getUserOrderProductReceivedPast(_id, page);
  return orders;
};

userSchema.statics.createProductReview = async function (_id, orderId, productId, rating, description) {
  const startDate = new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000);
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orderProductPurchased = await orderProductPurchasedModel.findOne({
      _id: orderId,
      placer: _id,
      'products.product._id': productId,
      createdAt: { $lt: startDate }
    }).session(session);
    if (!orderProductPurchased) {
      throwError(404, 'Order not found or order not in past orders.');
    }

    const product = await productModel.findById(productId).session(session);
    if (!product) {
      throwError(404, 'Product not found.');
    }

    const seller = await this.findById(product.seller).session(session);
    if (!seller) {
      throwError(404, 'Seller not found.');
    }

    const reviewExists = await productReviewModel.findOne({ reviewer: _id, orderProductPurchased: orderId, 'product._id': productId }).session(session);
    if (reviewExists) {
      throwError(409, 'User already gave review for this order\'s product.');
    }

    const productReview = new productReviewModel({
      reviewer: _id,
      orderProductPurchased: orderId,
      product,
      rating,
      description
    });

    await productReview.save({ session });

    if (rating === 1) {
      product.avgRating.oneStar += 1;
      seller.avgProductRating.oneStar += 1;
    }
    else if (rating === 2) {
      product.avgRating.twoStar += 1;
      seller.avgProductRating.twoStar += 1;
    }
    else if (rating === 3) {
      product.avgRating.threeStar += 1;
      seller.avgProductRating.threeStar += 1;
    }
    else if (rating === 4) {
      product.avgRating.fourStar += 1;
      seller.avgProductRating.fourStar += 1;
    }
    else if (rating === 5) {
      product.avgRating.fiveStar += 1;
      seller.avgProductRating.fiveStar += 1;
    }

    await product.save({ session });
    await seller.save({ session });

    await session.commitTransaction();
    await session.endSession();
    return { seller, productReview, productBoosted: product.boostPlan.name !== 'No Plan' };
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.getProductReviews = async function (productId) {
  const reviews = await productReviewModel.getProductReviews(productId);
  return reviews;
};

userSchema.statics.getAllProductReviews = async function (productId, page, rating) {
  const reviews = await productReviewModel.getAllProductReviews(productId, page, rating);
  return reviews;
};

userSchema.statics.getSellerReviews = async function (_id, sellerId) {
  const reviews = await productReviewModel.getSellerReviews(sellerId);
  return reviews;
};

userSchema.statics.getAllSellerReviews = async function (_id, sellerId, page, rating) {
  const reviews = await productReviewModel.getAllSellerReviews(sellerId, page, rating);
  return reviews;
};

userSchema.statics.getSellerProducts = async function (_id, sellerId, page) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }
  const products = await productModel.getSellerProducts(user, sellerId, page);
  return products;
};

userSchema.statics.getSellerProductsGuestMode = async function (sellerId, page) {
  const products = await productModel.getSellerProductsGuestMode(sellerId, page);
  return products;
};

userSchema.statics.getSellerServices = async function (_id, sellerId, page) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }
  const services = await serviceModel.getSellerServices(user, sellerId, page);
  return services;
};

userSchema.statics.getSellerServicesGuestMode = async function (sellerId, page) {
  const services = await serviceModel.getSellerServicesGuestMode(sellerId, page);
  return services;
};

//subscription routes
userSchema.statics.addWishlistProduct = async function (_id, productId) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.subscriptionPlan.wishlistFeature) {
    throwError(409, 'Wishlist feature is not available for this package.');
  }

  const product = await productModel.findById(productId);

  if (!product) {
    throwError(404, 'Product not found.');
  }

  if (product.seller.equals(_id)) {
    throwError(409, 'User cannot wishlist his own products.');
  }

  const wishlistProduct = await wishlistProductModel.addUserWishlistProduct(_id, productId);
  return wishlistProduct;
};

userSchema.statics.deleteWishlistProduct = async function (_id, productId) {
  await wishlistProductModel.deleteUserWishlistProduct(_id, productId);
};

userSchema.statics.getWishlistProducts = async function (_id, page) {
  const wishlistProducts = await wishlistProductModel.getUserWishlistProducts(_id, page);
  return wishlistProducts;
};

userSchema.statics.getSearchedWishlistProducts = async function (_id, name, page) {
  const wishlistProducts = await wishlistProductModel.getUserSearchedWishlistProducts(_id, name, page);
  return wishlistProducts;
};

userSchema.statics.addWishlistService = async function (_id, serviceId) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.subscriptionPlan.wishlistFeature) {
    throwError(409, 'Wishlist feature is not available for this package.');
  }

  const service = await serviceModel.findById(serviceId);

  if (!service) {
    throwError(404, 'Service not found.');
  }

  if (service.seller.equals(_id)) {
    throwError(409, 'User cannot wishlist his own services.');
  }

  const wishlistService = await wishlistServiceModel.addUserWishlistService(_id, serviceId);
  return wishlistService;
};

userSchema.statics.deleteWishlistService = async function (_id, serviceId) {
  await wishlistServiceModel.deleteUserWishlistService(_id, serviceId);
};

userSchema.statics.getWishlistServices = async function (_id, page) {
  const wishlistServices = await wishlistServiceModel.getUserWishlistServices(_id, page);
  return wishlistServices;
};

userSchema.statics.getSearchedWishlistServices = async function (_id, name, page) {
  const wishlistServices = await wishlistServiceModel.getUserSearchedWishlistServices(_id, name, page);
  return wishlistServices;
};

userSchema.statics.createStripeConnectedAccount = async function (_id, ip, bankDetails, dateOfBirth, idNumber) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.stripeConnectedAccount.id) {
    throwError(409, 'User stripe connected account is already created.');
  }

  if (!user.email.value) {
    throwError(404, 'User email address not found.');
  }

  if (!user.phoneNumber.value) {
    throwError(404, 'User phone number not found.');
  }

  let account;
  try {
    account = await createConnectedAccount(user.email.value, user.phoneNumber.value, ip, bankDetails, dateOfBirth, idNumber);
  } catch (err) {
    throwError(400, err.message);
  }
  if (!account) {
    throwError(400, 'Error creating connected account.');
  }
  const updatedUser = await this.findByIdAndUpdate(
    _id,
    {
      $set: {
        'stripeConnectedAccount.id': account.id,
      },
    },
    { new: true }
  );

  return updatedUser;
};

userSchema.statics.updateStripeConnectedAccount = async function (_id, verificationDocument, bankDetails) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.stripeConnectedAccount.id) {
    throwError(404, 'User does not have a connected account.');
  }

  let account;
  try {
    account = await updateConnectedAccount(user.stripeConnectedAccount.id, user.name, verificationDocument, bankDetails);
  } catch (err) {
    throwError(400, err.message);
  }
  if (!account) {
    throwError(400, 'Error updating connected account.');
  }
};

userSchema.statics.connectedAccountIssues = async function (_id) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.stripeConnectedAccount.id) {
    throwError(404, 'User does not have a connected account.');
  }

  const issueDoc = await stripeConnectedAccountIssuesModel.findOne({ 'event.data.object.id': user.stripeConnectedAccount.id });

  const now = new Date();
  if (now < new Date(issueDoc.updatedAt).getTime() + 60 * 1000) {
    throwError(409, 'Data currently not available.');
  }

  const issues = [];
  for (const x of issueDoc.event.data.object.future_requirements.eventually_due) {
    issues.push(x);
  }
  return issues;
};


// userSchema.statics.deleteConnectedAccount = async function (_id) {
//   const user = await this.findById(_id);

//   if (!user) {
//     throwError(404, 'User not found.');
//   }

//   if (!user.stripeConnectedAccount.id) {
//     throwError(409, 'User does not have a connected account.');
//   }

//   await axios.delete(`https://api.stripe.com/v1/accounts/${user.stripeConnectedAccount.id}`, {
//     headers: {
//       Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
//     }
//   });
// };

userSchema.statics.stripeCreateCustomerCard = async function (_id, paymentMethodId) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.stripeCustomer.id) {
    const data = await createCustomer(user.name, user.email.value);

    user.stripeCustomer.id = data.id;
    user.stripeCustomer.paymentMethod.id = null;
    user.stripeCustomer.paymentMethod.brand = '';
    user.stripeCustomer.paymentMethod.exp_month = '';
    user.stripeCustomer.paymentMethod.exp_year = '';
    user.stripeCustomer.paymentMethod.last4 = '';
    await user.save();
  }

  const data = await customerAttachCard(user.stripeCustomer.id, paymentMethodId);

  user.stripeCustomer.paymentMethod.id = data.id;
  user.stripeCustomer.paymentMethod.brand = data.brand;
  user.stripeCustomer.paymentMethod.exp_month = data.exp_month;
  user.stripeCustomer.paymentMethod.exp_year = data.exp_year;
  user.stripeCustomer.paymentMethod.last4 = data.last4;

  await user.save();
  return { stripeCustomer: { id: user.stripeCustomer.id, paymentMethod: data } };
};

userSchema.statics.deleteCustomerCard = async function (_id) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }
  if (!user.stripeCustomer.id) {
    throwError(404, 'User doest not have a card attached.');
  }
  if (!user.stripeCustomer.paymentMethod.id) {
    throwError(404, 'User doest not have a card attached.');
  }
  await detachPaymentMethod(user.stripeCustomer.paymentMethod.id);
};

userSchema.statics.addFundsToWallet = async function (_id, amount) {
  const user = await this.findById(_id);

  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.stripeCustomer.id || !user.stripeCustomer.paymentMethod.id) {
    throwError(404, 'User does not have a card attached.');
  }

  const a = await createPaymentIntentCard(amount, user.stripeCustomer.id, user.stripeCustomer.paymentMethod.id);
  const f = new fundsAddedToWalletModel({ user: _id, paymentIntentId: a.paymentIntentId });
  await f.save();
  return a;
};

userSchema.statics.payoutFromWallet = async function (_id, amount) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await this.findById(_id).session(session);

    if (!user) {
      throwError(404, 'User not found.');
    }

    if (!user.stripeConnectedAccount.id) {
      throwError(404, 'User connected account setup is not complete.');
    }

    if (user.walletBalance < amount) {
      throwError(409, 'Not enough funds in wallet.');
    }

    user.walletBalance -= amount;
    user.walletBalance = parseFloat(user.walletBalance.toFixed(2));
    await user.save({ session });

    const transaction = new transactionHistoryModel({
      user: _id,
      type: 'debit',
      amount: amount
    });
    await transaction.save({ session });

    await createTransfer(amount, user.stripeConnectedAccount.id).catch(err => throwError(403, err.message));

    await session.commitTransaction();
    await session.endSession();

    return user.walletBalance;
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

userSchema.statics.blockUser = async function (_id, userId) {
  const updatedUser = await this.findOneAndUpdate(
    { _id: userId, adminStatus: { $ne: 'blocked' } },
    {
      $set: {
        adminStatus: 'blocked'
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User already blocked or user not found.');
  }

  sendNotification.sendCommonNotificationSingleUser(null, updatedUser._id, 'Account Blocked', [], 'Your account has been blocked by the admin.', {}, updatedUser.pushNotificationTokens, false).catch(err => { });

  return updatedUser;
};

userSchema.statics.unblockUser = async function (_id, userId) {
  const updatedUser = await this.findOneAndUpdate(
    { _id: userId, adminStatus: 'blocked' },
    {
      $set: {
        adminStatus: 'active'
      }
    },
    { new: true }
  );

  if (!updatedUser) {
    throwError(404, 'User already unblocked or user not found.');
  }

  sendNotification.sendCommonNotificationSingleUser(null, updatedUser._id, 'Account Reactivated', [], 'Your account has been reactivated by the admin.', {}, updatedUser.pushNotificationTokens, false).catch(err => { });

  return updatedUser;
};

userSchema.statics.subscribePaidPlanStripe = async function (_id, subscriptionName) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (!user.stripeCustomer.id) {
    throwError(404, 'User does not have a card attached.');
  }

  if (!user.stripeCustomer.paymentMethod.id) {
    throwError(404, 'User does not have a card attached.');
  }

  if (user.subscriptionPlan.transactionId) {
    throwError(409, 'User already have a plan selected.');
  }

  let priceId = null;
  switch (subscriptionName) {
    case 'Basic Plan':
      priceId = process.env.STRIPE_SUBSCRIPTION_BASIC_PLAN;
      break;
    case 'Standard Plan':
      priceId = process.env.STRIPE_SUBSCRIPTION_STANDARD_PLAN;
      break;
    case 'Premium Plan':
      priceId = process.env.STRIPE_SUBSCRIPTION_PREMIUM_PLAN;
  }

  const subscription = await createSubscription(user.stripeCustomer.id, priceId);
  const subscriptionStripe = new subscriptionStripeModel({
    user: _id,
    paymentIntentId: subscription.paymentIntentId,
    subscriptionId: subscription.subscriptionId,
    subscriptionName: subscriptionName
  });
  await subscriptionStripe.save();
  const paySubscription = await paySubscriptionCard(subscription.paymentIntentId, user.stripeCustomer.paymentMethod.id);
  // ✅ Referral
  console.log("user=====referels==", user.influencerRef);

  // -----------------------
  if (user.influencerRef) {
    console.log("in");

    const existingReward = await ReferralReward.findOne({
      referredUser: _id
    });
    console.log("test in");

    if (!existingReward) {
      console.log("not found");

      const influencer = await this.findById(user.influencerRef);
      console.log("influencer====", influencer);


      if (influencer && influencer.influencerRate) {
        const amountPaid = (paySubscription.amount_received || 0) / 100; // Stripe usually returns in cents
        const percentage = influencer.influencerRate;
        const referralAmount = parseFloat(((amountPaid * percentage) / 100).toFixed(2));

        const reward = new ReferralReward({
          influencer: influencer._id,
          referredUser: _id,
          isSubscriptionPaid: true,
          subscriptionPlan: subscriptionName,
          amountPaid,
          referralPercentage: percentage,
          referralAmount
        });

        await reward.save();
        const existingWallet = await InfluencerWallet.findOne({ influencer: influencer._id });
        if (existingWallet) {
          existingWallet.amount += referralAmount;
          await existingWallet.save();
        }
        else {
          await InfluencerWallet.create({
            influencer: influencer._id,
            amount: referralAmount
          });
        }
      }
    }
  }
  return { paymentIntent: paySubscription.id, clientSecret: paySubscription.client_secret, status: paySubscription.status };
};

userSchema.statics.unsubscribePaidPlanStripe = async function (_id) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }

  if (user.subscriptionPlan.platform !== 'stripe') {
    throwError(409, 'User does not have a stripe subscription.');
  }

  if (!user.subscriptionPlan.transactionId) {
    throwError(404, 'User transaction id not found.');
  }

  const unsubscribed = await stripeCancelSubscription(user.subscriptionPlan.transactionId);
  return unsubscribed;
};

// userSchema.statics.changeStripePaidPlan = async function (_id, subscriptionName) {
//   const user = await this.findById(_id);
//   if (!user) {
//     throwError(404, 'User not found.');
//   }

//   if (user.subscriptionPlan.platform !== 'stripe') {
//     throwError(409, 'User does not have stripe subscription active.');
//   }

//   if (!user.subscriptionPlan.transactionId) {
//     throwError(404, 'User transaction id not found.');
//   }

//   if (user.subscriptionPlan.name === subscriptionName) {
//     throwError(409, 'Cannot change to already selected plan.');
//   }

//   let priceId = null;
//   switch (subscriptionName) {
//     case 'Basic Plan':
//       priceId = process.env.STRIPE_SUBSCRIPTION_BASIC_PLAN;
//       break;
//     case 'Standard Plan':
//       priceId = process.env.STRIPE_SUBSCRIPTION_STANDARD_PLAN;
//       break;
//     case 'Premium Plan':
//       priceId = process.env.STRIPE_SUBSCRIPTION_PREMIUM_PLAN;
//   }

//   let prorate;
//   if (user.subscriptionPlan.name === 'Basic Plan') {
//     prorate = true;
//   } else if (user.subscriptionPlan.name === 'Standard Plan') {
//     if (subscriptionName === 'Basic Plan') {
//       prorate = false;
//     }
//     else if (subscriptionName === 'Premium Plan') {
//       prorate = true;
//     }
//   } else if (user.subscriptionPlan.name === 'Premium Plan') {
//     prorate = false;
//   }

//   const changedSubscription = await changeSubscription(user.subscriptionPlan.transactionId, priceId, prorate);
//   return changedSubscription;
// };

userSchema.statics.productBoostPaidPlanStripe = async function (_id, prodId, boostName) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }
  if (!user.stripeCustomer.id || !user.stripeCustomer.paymentMethod.id) {
    throwError(404, 'User does not have a card attached.');
  }

  const product = await productModel.findById(prodId);
  if (!product) {
    throwError(404, 'Product not found.');
  }
  if (!product.seller.equals(_id)) {
    throwError(409, 'User does not own this product.');
  }
  if (product.status !== 'active') {
    throwError(409, 'Product is not active.');
  }
  if (product.adminStatus === 'blocked') {
    throwError(409, 'Product has been blocked by admin.');
  }
  if (product.boostPlan.name !== 'No Plan') {
    throwError(409, 'Product is already boosted.');
  }

  let amount = 0;
  switch (boostName) {
    case 'Quick Start':
      amount = 28.99;
      break;
    case 'Extended Exposure':
      amount = 43.99;
      break;
    case 'Maximum Impact':
      amount = 84.99;
  }

  const a = await createPaymentIntentCard(amount, user.stripeCustomer.id, user.stripeCustomer.paymentMethod.id);
  const b = new productBoostStripeModel({ user: _id, product: prodId, paymentIntentId: a.paymentIntentId, boostName });
  await b.save();
  return a;
};

userSchema.statics.serviceBoostPaidPlanStripe = async function (_id, serviceId, boostName) {
  const user = await this.findById(_id);
  if (!user) {
    throwError(404, 'User not found.');
  }
  if (!user.stripeCustomer.id || !user.stripeCustomer.paymentMethod.id) {
    throwError(404, 'User does not have a card attached.');
  }

  const service = await serviceModel.findById(serviceId);
  if (!service) {
    throwError(404, 'Service not found.');
  }
  if (!service.seller.equals(_id)) {
    throwError(409, 'User does not own this service.');
  }
  if (service.status !== 'active') {
    throwError(409, 'Service is not active.');
  }
  if (service.boostPlan.name !== 'No Plan') {
    throwError(409, 'Service is already boosted.');
  }

  let amount = 0;
  switch (boostName) {
    case 'Quick Start':
      amount = 28.99;
      break;
    case 'Extended Exposure':
      amount = 43.99;
      break;
    case 'Maximum Impact':
      amount = 84.99;
  }

  const a = await createPaymentIntentCard(amount, user.stripeCustomer.id, user.stripeCustomer.paymentMethod.id);
  const b = new serviceBoostStripeModel({ user: _id, service: serviceId, paymentIntentId: a.paymentIntentId, boostName });
  await b.save();
  return a;
};

export default mongoose.model('user', userSchema);
