import { userModel } from '../models/index.js';
import { createJWT, sendNotification } from '../utils/index.js';

export const emailPasswordSignUp = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role, influencerRef } = req.body;

    const data = await userModel.emailPasswordSignUp(
      name,
      email,
      phoneNumber,
      password,
      role,
      influencerRef
    );
    const token = createJWT(data._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const emailPasswordSignUpAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const data = await userModel.emailPasswordSignUpAdmin(
      name,
      email,
      password,
      role
    );
    const token = createJWT(data._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const emailPasswordLogIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await userModel.emailPasswordLogIn(email, password);
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

export const appleLogin = async (req, res, next) => {
  try {
    const { name, email, appleAuthId, profileImage } = req.body;
    const data = await userModel.appleLogin(
      name,
      email,
      appleAuthId,
      profileImage
    );
    const token = createJWT(data._id);
    res.status(200).json({
      success: true,
      message: 'Apple login successful.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { name, email, googleAuthId, profileImage } = req.body;
    const data = await userModel.googleLogin(
      name,
      email,
      googleAuthId,
      profileImage
    );
    const token = createJWT(data._id);
    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const facebookLogin = async (req, res, next) => {
  try {
    const { name, email, facebookAuthId, profileImage } = req.body;
    const data = await userModel.facebookLogin(
      name,
      email,
      facebookAuthId,
      profileImage
    );
    const token = createJWT(data._id);
    res.status(200).json({
      success: true,
      message: 'Facebook login successful.',
      data: { ...data, token }
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordSendEmailOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await userModel.forgotPasswordSendEmailOTP(email);
    res.status(200).json({
      success: true,
      message: `OTP sent to your email address ${email}`,
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordVerifyEmailOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await userModel.forgotPasswordVerifyEmailOTP(email, otp);
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordUpdatePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await userModel.forgotPasswordUpdatePassword(email, password);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      data: data.password,
    });
  } catch (err) {
    next(err);
  }
};

//authorized routes
export const adminId = async (req, res, next) => {
  try {
    const data = await userModel.findOne({ role: 'admin' });
    res.status(200).json({
      success: true,
      message: 'Admin id retrieved successfully.',
      data: data._id
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailSendEmailOTP = async (req, res, next) => {
  try {
    await userModel.verifyEmailSendEmailOTP(req.user._id);
    res.status(200).json({
      success: true,
      message: `OTP sent to your email address.`,
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailVerifyEmailOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const data = await userModel.verifyEmailVerifyEmailOTP(req.user._id, otp);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: data.email,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPhoneNumberSendSMSOTP = async (req, res, next) => {
  try {
    await userModel.verifyPhoneNumberSendSMSOTP(req.user._id);
    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPhoneNumberVerifySMSOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const data = await userModel.verifyPhoneNumberVerifySMSOTP(req.user._id, otp);
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
      data: data.phoneNumber,
    });
  } catch (err) {
    next(err);
  }
};

export const updateIdentityVerified = async (req, res, next) => {
  try {
    const data = await userModel.updateIdentityVerified(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Identity verified successfully.',
      data: data.identityVerified
    });
  } catch (err) {
    next(err);
  }
};

export const subscribeFreePlan = async (req, res, next) => {
  try {
    const data = await userModel.subscribeFreePlan(req.user._id);
    res.status(201).json({
      success: true,
      message: 'User subscribed to free plan.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const subscribePaidPlanGoogle = async (req, res, next) => {
  try {
    const { purchaseToken, subscriptionId } = req.body;
    const data = await userModel.subscribePaidPlanGoogle(req.user._id, purchaseToken, subscriptionId);
    res.status(201).json({
      success: true,
      message: 'User subscribed successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const unsubscribePaidPlanGoogle = async (req, res, next) => {
  try {
    const data = await userModel.unsubscribePaidPlanGoogle(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User unsubscribed successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const subscribePaidPlanApple = async (req, res, next) => {
  try {
    const { receipt } = req.body;
    const data = await userModel.subscribePaidPlanApple(req.user._id, receipt);
    res.status(201).json({
      success: true,
      message: 'User subscribed successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    const data = await userModel.updateAddress(
      req.user._id,
      streetAddress,
      apartment_suite,
      country,
      state,
      city,
      zipCode
    );
    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data: data.address,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    const profileImage = req.files.filter(t => t.fieldname === 'profileImage');
    const url = await userModel.updateProfileImage(req.user._id, profileImage[0]);
    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      data: url
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProfileImage = async (req, res, next) => {
  try {
    await userModel.deleteProfileImage(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const updateName = async (req, res, next) => {
  try {
    const { name } = req.body;
    const data = await userModel.updateName(req.user._id, name);
    res.status(200).json({
      success: true,
      message: 'Name updated successfully.',
      data: data.name,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePhoneNumberSendSMSOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    await userModel.updatePhoneNumberSendSMSOTP(req.user._id, phoneNumber);
    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePhoneNumberVerifySMSOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    const data = await userModel.updatePhoneNumberVerifySMSOTP(
      req.user._id,
      phoneNumber,
      otp
    );
    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully.',
      data: data.phoneNumber,
    });
  } catch (err) {
    next(err);
  }
};

export const createPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const data = await userModel.createPassword(req.user._id, password);
    res.status(201).json({
      success: true,
      message: 'Password created successfully.',
      data: data.password
    });
  } catch (err) {
    next(err);
  }
};


export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const data = await userModel.updatePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      data: data.password,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePickupAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    const data = await userModel.updatePickupAddress(
      req.user._id,
      streetAddress,
      apartment_suite,
      country,
      state,
      city,
      zipCode
    );
    res.status(200).json({
      success: true,
      message: 'Pickup address updated successfully.',
      data: data.pickupAddress,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePickupAddress = async (req, res, next) => {
  try {
    const data = await userModel.deletePickupAddress(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Pickup address deleted successfully.',
      data: data.pickupAddress,
    });
  } catch (err) {
    next(err);
  }
};

export const addDeliveryAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    const data = await userModel.addDeliveryAddress(
      req.user._id,
      streetAddress,
      apartment_suite,
      country,
      state,
      city,
      zipCode
    );
    res.status(201).json({
      success: true,
      message: 'Delivery address added successfully.',
      data: data.deliveryAddresses,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryAddress = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    const data = await userModel.updateDeliveryAddress(
      req.user._id,
      _id,
      streetAddress,
      apartment_suite,
      country,
      state,
      city,
      zipCode
    );
    res.status(200).json({
      success: true,
      message: 'Delivery address updated successfully.',
      data: data.deliveryAddresses,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryAddress = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.deleteDeliveryAddress(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
      data: data.deliveryAddresses,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePushNotificationOptions = async (req, res, next) => {
  try {
    const {
      chatMessages,
      boostedProductsAndServices,
      wishlistItems,
      customerSupport,
    } = req.body;
    const data = await userModel.updatePushNotificationOptions(
      req.user._id,
      chatMessages,
      boostedProductsAndServices,
      wishlistItems,
      customerSupport,
    );
    res.status(200).json({
      success: true,
      message: 'Push Notification options updates successfully.',
      data: data.pushNotificationOptions,
    });
  } catch (err) {
    next(err);
  }
};

export const addPushNotificationToken = async (req, res, next) => {
  try {
    const { platform, token } = req.body;
    const data = await userModel.addPushNotificationToken(
      req.user._id,
      platform,
      token
    );
    res.status(201).json({
      success: true,
      message: 'Push notification token added successfully.',
      data: data.pushNotificationTokens,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePushNotificationToken = async (req, res, next) => {
  try {
    const { platform, token } = req.query;
    const data = await userModel.deletePushNotificationToken(
      req.user._id,
      platform,
      token
    );
    res.status(200).json({
      success: true,
      message: 'Push notification token deleted successfully.',
      data: data.pushNotificationTokens,
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const data = await userModel.getProfile(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getUserProfile(_id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getTransactionHistory = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getTransactionHistory(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Transaction history retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getNotifications(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationsViewed = async (req, res, next) => {
  try {
    await userModel.markNotificationsViewed(req.user._id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked viewed successfully.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { type, selectedReason, otherReason } = req.body;
    const data = await userModel.createReport(req.user._id, _id, type, selectedReason, otherReason);
    res.status(201).json({
      success: true,
      message: 'User reported successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const activateUser = async (req, res, next) => {
  try {
    const data = await userModel.activateUser(req.user._id);
    res.status(201).json({
      success: true,
      message: 'User account activated successfully.',
      data: data.status
    });
  } catch (err) {
    next(err);
  }
};

export const getListingsVisibleCount = async (req, res, next) => {
  try {
    const data = await userModel.getListingsVisibleCount(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Listings visible count retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const data = await userModel.deactivateUser(req.user._id);
    res.status(201).json({
      success: true,
      message: 'User account deactivated successfully.',
      data: data.status
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { password } = req.body;
    await userModel.deleteUser(req.user._id, password);
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export const createEmailSupportRequest = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const data = await userModel.createEmailSupportRequest(req.user._id, title, description);
    res.status(201).json({
      success: true,
      message: 'Email support request created successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getProduct(req.user?._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getService(req.user?._id, _id);
    res.status(200).json({
      success: true,
      message: 'Service retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

//chat route
export const uploadChatAttachments = async (req, res, next) => {
  try {
    const attachments = req.files?.filter(t => t.fieldname === 'attachments');

    const data = await userModel.uploadChatAttachments(req.user._id, attachments);
    res.status(201).json({
      success: true,
      message: 'Attachments uploaded successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getProfileDetails = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getProfileDetails(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Profile details retrieved successfully.',
      data: { email: data.email, phoneNumber: data.phoneNumber, name: data.name, profileImage: data.profileImage }
    });
  } catch (err) {
    next(err);
  }
};

export const chatBlockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.chatBlockUser(req.user._id, _id);
    res.status(201).json({
      success: true,
      message: 'User blocked from chat successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const sendChatMessageNotification = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { title, attachments, body } = req.body;
    const data = await userModel.sendChatMessageNotification(req.user._id, _id, title, attachments, body);
    res.status(201).json({
      success: true,
      message: 'Chat message notification sent successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const sendCustomerSupportChatMessageNotification = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { title, attachments, body } = req.body;
    const data = await userModel.sendCustomerSupportChatMessageNotification(req.user._id, _id, title, attachments, body);
    res.status(201).json({
      success: true,
      message: 'Customer support chat message notification sent successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

//seller routes
export const addProduct = async (req, res, next) => {
  try {
    const {
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
      location
    } = req.body;
    const images = req.files.filter(t => t.fieldname === 'images');
    const parsedLocation = location ? (typeof location === 'string' ? JSON.parse(location) : location) : undefined;
    console.log("???????????????????", req.moderationStatus, req.moderationReason);
    // Get moderation status from middleware
    const moderationStatus = req.moderationStatus;
    const moderationReason = req.moderationReason;

    const data = await userModel.addProduct(
      req.user._id,
      images,
      displayImageIndex,
      name,
      category,
      subCategory,
      description,
      country,
      state,
      city,
      JSON.parse(fulfillmentMethod),
      pickupAddress,
      price,
      quantity,
      parsedLocation,
      moderationStatus,
      moderationReason
    );

    // Different response based on moderation status
    if (moderationStatus === 'pending_review') {
      res.status(202).json({
        success: true,
        message: 'Product submitted successfully and is pending review.',
        data: data
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Product added successfully.',
        data: data
      });
    }
  } catch (err) {
    next(err);
  }
};

export const productBoostFreePlan = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.productBoostFreePlan(req.user._id, _id);
    sendNotification.sendProductBoostedNotification(_id).catch(err => console.log(err));
    res.status(201).json({
      success: true,
      message: 'Product boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const productBoostPaidPlanGoogle = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { purchaseToken, productId } = req.body;
    const data = await userModel.productBoostPaidPlanGoogle(req.user._id, _id, purchaseToken, productId);
    res.status(201).json({
      success: true,
      message: 'Product boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const productBoostPaidPlanApple = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { receipt } = req.body;
    const data = await userModel.productBoostPaidPlanApple(req.user._id, _id, receipt);
    res.status(201).json({
      success: true,
      message: 'Product boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { price, quantity } = req.body;
    const { backInStock, product } = await userModel.updateProduct(req.user._id, _id, price, quantity);
    if (backInStock) {
      sendNotification.sendWishlistItemBackInStock(_id).catch(err => console.log(err));
    }
    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await userModel.deleteProduct(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getProducts(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getProductsBoosted = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getProductsBoosted(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Boosted Products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedProducts(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedProductsBoosted = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedProductsBoosted(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched boosted products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const addService = async (req, res, next) => {
  try {
    const {
      displayImageIndex,
      name,
      description,
      country,
      state,
      city,
      price,
    } = req.body;
    console.log("new service ", req.body);
    const images = req.files.filter(t => t.fieldname === 'images');

    // Get moderation status from middleware
    const moderationStatus = req.moderationStatus;
    const moderationReason = req.moderationReason;

    const data = await userModel.addService(
      req.user._id,
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

    // Different response based on moderation status
    if (moderationStatus === 'pending_review') {
      res.status(202).json({
        success: true,
        message: 'Service submitted successfully and is pending review.',
        data: data
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Service created successfully.',
        data: data
      });
    }
  } catch (err) {
    next(err);
  }
};

export const serviceBoostFreePlan = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.serviceBoostFreePlan(req.user._id, _id);
    sendNotification.sendServiceBoostedNotification(_id).catch(err => console.log(err));
    res.status(201).json({
      success: true,
      message: 'Service boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const serviceBoostPaidPlanGoogle = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { purchaseToken, productId } = req.body;
    const data = await userModel.serviceBoostPaidPlanGoogle(req.user._id, _id, purchaseToken, productId);
    res.status(201).json({
      success: true,
      message: 'Service boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const serviceBoostPaidPlanApple = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { receipt } = req.body;
    const data = await userModel.serviceBoostPaidPlanApple(req.user._id, _id, receipt);
    res.status(201).json({
      success: true,
      message: 'Service boosted successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

// export const updateService = async (req, res, next) => {
//   try {
//     const { _id } = req.params;
//     const {
//       currentImages,
//       displayImageIndex,
//       name,
//       description,
//       country,
//       state,
//       city,
//       price,
//     } = req.body;
//     const newImages = req.files?.filter(t => t.fieldname === 'newImages');
//     const parsedCurrentImages = currentImages ? JSON.parse(currentImages) : undefined;

//     const data = await userModel.updateService(req.user._id, _id, newImages, parsedCurrentImages, displayImageIndex, name, description, country, state, city, price);
//     res.status(200).json({
//       success: true,
//       message: 'Service updated successfully.',
//       data: data
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const updateService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { price } = req.body;
    const data = await userModel.updateService(req.user._id, _id, price);
    res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await userModel.deleteService(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Service deleted successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getServices(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getServicesBoosted = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getServicesBoosted(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Boosted services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedServices(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedServicesBoosted = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedServicesBoosted(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched boosted services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getProductCategories = async (req, res, next) => {
  try {
    const data = await userModel.getProductCategories();
    res.status(200).json({
      success: true,
      message: 'Product categories retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

//buyer routes
export const getHomeScreenProducts = async (req, res, next) => {
  try {
    const { city, state, lat, lng, radius } = req.query;
    let data;
    const geoFilter = lat && lng && radius
      ? {
        location: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(lng), parseFloat(lat)],
              parseFloat(radius) / 6378.1 // radius in radians (earth radius in km)
            ]
          }
        }
      }
      : {};
    if (req.user) {
      data = await userModel.getHomeScreenProducts(req.user._id, { city, state, geoFilter });
    }
    else {
      data = await userModel.getHomeScreenProductsGuestMode();
    }
    res.status(200).json({
      success: true,
      message: 'Home screen products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getHomeScreenSearchedProducts = async (req, res, next) => {
  try {
    const { name, category, subCategory, page, city, state, lat, lng, radius } = req.query;
    let data;
    if (req.user) {
      data = await userModel.getHomeScreenSearchedProducts(req.user._id, name, category, subCategory, page, city, state, lat, lng, radius);
    } else {
      data = await userModel.getHomeScreenSearchedProductsGuestMode(name, category, subCategory, page);
    }
    res.status(200).json({
      success: true,
      message: 'Home screen searched products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getHomeScreenSearchedProductsHistory = async (req, res, next) => {
  try {
    const data = await userModel.getHomeScreenSearchedProductsHistory(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User products search history retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getHomeScreenServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    let data;
    if (req.user) {
      data = await userModel.getHomeScreenServices(req.user._id, page);
    } else {
      data = await userModel.getHomeScreenServicesGuestMode(page);
    }
    res.status(200).json({
      success: true,
      message: 'Home screen services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getHomeScreenSearchedServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    let data;
    if (req.user) {
      data = await userModel.getHomeScreenSearchedServices(req.user._id, name, page);
    } else {
      data = await userModel.getHomeScreenSearchedServicesGuestMode(name, page);
    }
    res.status(200).json({
      success: true,
      message: 'Home screen searched services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getHomeScreenSearchedServicesHistory = async (req, res, next) => {
  try {
    const data = await userModel.getHomeScreenSearchedServicesHistory(req.user._id);
    res.status(200).json({
      success: true,
      message: 'User services search history retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const addCartProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { fulfillmentMethod } = req.body;
    const data = await userModel.addCartProduct(req.user._id, _id, fulfillmentMethod);
    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartProductIncrementByOne = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.updateCartProductIncrementByOne(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product quantity incremented by one successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const updateCartProductDecrementByOne = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.updateCartProductDecrementByOne(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product quantity decremented by one successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCartProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await userModel.deleteCartProduct(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product deleted from cart successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const cartClearProduct = async (req, res, next) => {
  try {
    await userModel.cartClearProduct(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart items removed successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getCartProducts = async (req, res, next) => {
  try {
    const data = await userModel.getCartProducts(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const cartProductVerify = async (req, res, next) => {
  try {
    await userModel.cartProductVerify(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart products verified successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const createOrderProductTransient = async (req, res, next) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    const data = await userModel.createOrderProductTransient(req.user._id, deliveryAddress, paymentMethod);
    res.status(201).json({
      success: true,
      message: 'Transient order created successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const createOrderProductPurchased = async (req, res, next) => {
  try {
    const data = await userModel.createOrderProductPurchased(req.user._id);
    res.status(201).json({
      success: true,
      message: data.paymentIntent ? data.paymentIntent.status === 'requires_action' ? 'Requires further action' : 'Purchased order created successfully' : 'Purchased order created successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderProductPurchasedCurrent = async (req, res, next) => {
  try {
    const data = await userModel.getOrderProductPurchasedCurrent(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Current orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderProductPurchasedPast = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getOrderProductPurchasedPast(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Past orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderProductReceivedCurrent = async (req, res, next) => {
  try {
    const data = await userModel.getOrderProductReceivedCurrent(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Received orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderProductReceivedPast = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getOrderProductReceivedPast(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Received orders retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { _oid, _pid } = req.params;
    const { rating, description } = req.body;
    const { seller, productReview, productBoosted } = await userModel.createProductReview(req.user._id, _oid, _pid, rating, description);
    sendNotification.sendProductReviewReceivedNotification(req.user._id, seller._id, productBoosted, _pid).catch(err => console.log(err));
    res.status(201).json({
      success: true,
      message: 'Product review created successfully.',
      data: productReview
    });
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getProductReviews(_id);
    res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getAllProductReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page, rating } = req.query;
    const data = await userModel.getAllProductReviews(_id, page, rating);
    res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.getSellerReviews(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Seller reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getAllSellerReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page, rating } = req.query;
    const data = await userModel.getAllSellerReviews(req.user._id, _id, page, rating);
    res.status(200).json({
      success: true,
      message: 'Seller reviews retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerProducts = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    let data;
    if (req.user) {
      data = await userModel.getSellerProducts(req.user._id, _id, page);
    } else {
      data = await userModel.getSellerProductsGuestMode(_id, page);
    }
    res.status(200).json({
      success: true,
      message: 'Seller products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerServices = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    let data;
    if (req.user) {
      data = await userModel.getSellerServices(req.user._id, _id, page);
    } else {
      data = await userModel.getSellerServicesGuestMode(_id, page);
    }
    res.status(200).json({
      success: true,
      message: 'Seller services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

//subscription routes
export const addWishlistProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.addWishlistProduct(req.user._id, _id);
    res.status(201).json({
      success: true,
      message: 'Product added to wishlist.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deleteWishlistProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await userModel.deleteWishlistProduct(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getWishlistProducts = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getWishlistProducts(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Wishlist products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedWishlistProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedWishlistProducts(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched wishlist products retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const addWishlistService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const data = await userModel.addWishlistService(req.user._id, _id);
    res.status(201).json({
      success: true,
      message: 'Service added to wishlist.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const deleteWishlistService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await userModel.deleteWishlistService(req.user._id, _id);
    res.status(200).json({
      success: true,
      message: 'Service removed from wishlist.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getWishlistServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    const data = await userModel.getWishlistServices(req.user._id, page);
    res.status(200).json({
      success: true,
      message: 'Wishlist services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchedWishlistServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    const data = await userModel.getSearchedWishlistServices(req.user._id, name, page);
    res.status(200).json({
      success: true,
      message: 'Searched wishlist services retrieved successfully.',
      data: data
    });
  } catch (err) {
    next(err);
  }
};
