import { nextError } from '../utils/index.js';
import { stringSchema, emailSchema, nameSchema, passwordSchema, phoneNumberSchema, streetAddressSchema, apartmentSuiteSchema, idSchema, platformSchema, pageSchema, productNameSchema, productDescriptionSchema, productFulfillmentMethodSchema, productPickupAddressSchema, productPriceSchema, productQuantitySchema, productUpdateQuantitySchema, profileImageSchema, zipCodeSchema, serviceNameSchema, serviceDescriptionSchema, servicePriceSchema, productImagesSchema, productDisplayImageIndexSchema, serviceDisplayImageIndexSchema, serviceImagesSchema, cartProductFulfillmentMethodSchema, cartProductPaymentMethod, productReviewRatingSchema, productReviewDescriptionSchema, emailSupportRequestTitle, emailSupportRequestDescription, chatMessageNotificationAttachmentsSchema, booleanSchema, reportedUserType, reportedUserReason, chatAttachmentsSchema, roleSchema } from './schemas/index.js';
import influencerRefSchema from './schemas/influencerRefSchema.js';
import productLocationSchema from './schemas/productLocationSchema.js';

export const emailPasswordSignUp = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;
    await nameSchema('Name').validate(name);
    await emailSchema('Email').validate(email);
    await phoneNumberSchema('Phone number').validate(phoneNumber);
    await passwordSchema('Password').validate(password);
    await roleSchema.validate(role);
    await influencerRefSchema
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const emailPasswordLogIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await stringSchema('Email').validate(email);
    await stringSchema('Password').validate(password);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const appleLogin = async (req, res, next) => {
  try {
    const { name, email, appleAuthId, profileImage } = req.body;
    if (name !== '') {
      await stringSchema('Name').validate(name);
    }
    if (email !== '') {
      await stringSchema('Email').validate(email);
    }
    await stringSchema('Apple auth id').validate(appleAuthId);
    if (profileImage !== '') {
      await stringSchema('Profile image').validate(profileImage);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { name, email, googleAuthId, profileImage } = req.body;
    if (name !== '') {
      await stringSchema('Name').validate(name);
    }
    if (email !== '') {
      await stringSchema('Email').validate(email);
    }
    await stringSchema('Google auth id').validate(googleAuthId);
    if (profileImage !== '') {
      await stringSchema('Profile image').validate(profileImage);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const facebookLogin = async (req, res, next) => {
  try {
    const { name, email, facebookAuthId, profileImage } = req.body;
    if (name !== '') {
      await stringSchema('Name').validate(name);
    }
    if (email !== '') {
      await stringSchema('Email').validate(email);
    }
    await stringSchema('Facebook auth id').validate(facebookAuthId);
    if (profileImage !== '') {
      await stringSchema('Profile image').validate(profileImage);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const forgotPasswordSendEmailOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await stringSchema('Email').validate(email);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const forgotPasswordVerifyEmailOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await stringSchema('Email').validate(email);
    await stringSchema('OTP').validate(otp);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const forgotPasswordUpdatePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await stringSchema('Email').validate(email);
    await passwordSchema('Password').validate(password);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

//Authorized Routes
export const adminId = async (req, res, next) => {
  next();
};

export const verifyEmailSendEmailOTP = async (req, res, next) => {
  next();
};

export const verifyEmailVerifyEmailOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    await stringSchema('OTP').validate(otp);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const verifyPhoneNumberSendSMSOTP = async (req, res, next) => {
  next();
};

export const verifyPhoneNumberVerifySMSOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    await stringSchema('OTP').validate(otp);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateIdentityVerified = async (req, res, next) => {
  next();
};

export const subscribeFreePlan = async (req, res, next) => {
  next();
};

export const subscribePaidPlanGoogle = async (req, res, next) => {
  try {
    const { purchaseToken, subscriptionId } = req.body;
    await stringSchema('Purchase token').validate(purchaseToken);
    await stringSchema('Subscription id').validate(subscriptionId);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const unsubscribePaidPlanGoogle = async (req, res, next) => {
  next();
};

export const subscribePaidPlanApple = async (req, res, next) => {
  try {
    const { receipt } = req.body;
    await stringSchema('Receipt').validate(receipt);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    if (streetAddress !== '') {
      await streetAddressSchema('Street address').validate(streetAddress);
    }
    if (apartment_suite !== '') {
      await apartmentSuiteSchema('Apartment / Suite').validate(apartment_suite);
    }
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    if (zipCode !== '') {
      await zipCodeSchema('Zip code').validate(zipCode);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    const profileImage = req.files?.filter(t => t.fieldname === 'profileImage');
    await profileImageSchema('Profile image').validate(profileImage);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteProfileImage = async (req, res, next) => {
  next();
};

export const updateName = async (req, res, next) => {
  try {
    const { name } = req.body;
    await nameSchema('Name').validate(name);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updatePhoneNumberSendSMSOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    await phoneNumberSchema('Phone number').validate(phoneNumber);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updatePhoneNumberVerifySMSOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp } = req.body;
    await phoneNumberSchema('Phone number').validate(phoneNumber);
    await stringSchema('OTP').validate(otp);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const createPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    await passwordSchema('Password').validate(password);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await stringSchema('Current password').validate(currentPassword);
    await passwordSchema('New password').validate(newPassword);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updatePickupAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    await streetAddressSchema('Street address').validate(streetAddress);
    if (apartment_suite !== '') {
      await apartmentSuiteSchema('Apartment / Suite').validate(apartment_suite);
    }
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    if (zipCode !== '') {
      await zipCodeSchema('Zip code').validate(zipCode);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deletePickupAddress = async (req, res, next) => {
  next();
};

export const addDeliveryAddress = async (req, res, next) => {
  try {
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    await streetAddressSchema('Street address').validate(streetAddress);
    if (apartment_suite !== '') {
      await apartmentSuiteSchema('Apartment / Suite').validate(apartment_suite);
    }
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    if (zipCode !== '') {
      await zipCodeSchema('Zip code').validate(zipCode);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateDeliveryAddress = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { streetAddress, apartment_suite, country, state, city, zipCode } =
      req.body;
    await idSchema('Delivery address id').validate(_id);
    await streetAddressSchema('Street address').validate(streetAddress);
    if (apartment_suite !== '') {
      await apartmentSuiteSchema('Apartment / Suite').validate(apartment_suite);
    }
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    if (zipCode !== '') {
      await zipCodeSchema('Zip code').validate(zipCode);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteDeliveryAddress = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Delivery address id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
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
    await booleanSchema('Chat messages').validate(chatMessages);
    await booleanSchema('Boosted products and services').validate(boostedProductsAndServices);
    await booleanSchema('Wishlist items').validate(wishlistItems);
    await booleanSchema('Customer support').validate(customerSupport);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const addPushNotificationToken = async (req, res, next) => {
  try {
    const { platform, token } = req.body;
    await platformSchema('Platform').validate(platform);
    await stringSchema('Token').validate(token);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deletePushNotificationToken = async (req, res, next) => {
  try {
    const { platform, token } = req.query;
    await platformSchema('Platform').validate(platform);
    await stringSchema('Token').validate(token);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProfile = async (req, res, next) => {
  next();
};

export const getUserProfile = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('User id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getTransactionHistory = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const markNotificationsViewed = async (req, res, next) => {
  next();
};

export const createReport = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { type, selectedReason, otherReason } = req.body;
    await idSchema('Reported user id').validate(_id);
    await reportedUserType('Type').validate(type);
    if (selectedReason !== '') {
      await stringSchema('Selected reason').validate(selectedReason);
    }
    if (otherReason !== '') {
      await stringSchema('Other reason').validate(otherReason);
    }
    await reportedUserReason('Reason').validate({ selectedReason, otherReason });
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const activateUser = async (req, res, next) => {
  next();
};

export const getListingsVisibleCount = async (req, res, next) => {
  next();
};

export const deactivateUser = async (req, res, next) => {
  next();
};

export const deleteUser = async (req, res, next) => {
  // try {
  //   const { password } = req.body;
  //   await stringSchema('Password').validate(password);
  next();
  // } catch (err) {
  // next({ ...err, status: 400 });
  // }
};

export const createEmailSupportRequest = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    await emailSupportRequestTitle('Title').validate(title);
    await emailSupportRequestDescription('Description').validate(description);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Service id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

//chat routes
export const uploadChatAttachments = async (req, res, next) => {
  try {
    const attachments = req.files?.filter(t => t.fieldname === 'attachments');

    await chatAttachmentsSchema('Attachments').validate(attachments);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProfileDetails = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('user id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const chatBlockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Blocked user id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const sendChatMessageNotification = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { title, attachments, body } = req.body;
    await idSchema('Receiver Id').validate(_id);
    await stringSchema('Title').validate(title);
    await chatMessageNotificationAttachmentsSchema('Attachments').validate(attachments);
    await stringSchema('Body').validate(body);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const sendCustomerSupportChatMessageNotification = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { title, attachments, body } = req.body;
    await idSchema('Receiver Id').validate(_id);
    await stringSchema('Title').validate(title);
    await chatMessageNotificationAttachmentsSchema('Attachments').validate(attachments);
    await stringSchema('Body').validate(body);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
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
    const images = req.files?.filter(t => t.fieldname === 'images');

    await productImagesSchema('Images').validate(images);
    await productDisplayImageIndexSchema('Display image index').validate({ displayImageIndex, images });
    await productNameSchema('Name').validate(name);
    await stringSchema('Category').validate(category);
    await stringSchema('Sub category').validate(subCategory);
    await productDescriptionSchema('Description').validate(description);
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    await productFulfillmentMethodSchema('Fulfillment method').validate(fulfillmentMethod ? JSON.parse(fulfillmentMethod) : {});
    if (pickupAddress !== '') {
      await productPickupAddressSchema('Pickup address').validate(pickupAddress);
    }
    await productPriceSchema('Price').validate(price);
    await productQuantitySchema('Quantity').validate(quantity);
    if (location) {
      const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
      await productLocationSchema('Location').validate(parsedLocation);
      req.body.location = parsedLocation; // so it's correctly formatted for later DB use
    }
    
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const productBoostFreePlan = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const productBoostPaidPlanGoogle = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { purchaseToken, productId } = req.body;
    await idSchema('Product id').validate(_id);
    await stringSchema('Purchase token').validate(purchaseToken);
    await stringSchema('Product id').validate(productId);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const productBoostPaidPlanApple = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { receipt } = req.body;
    await idSchema('Product id').validate(_id);
    await stringSchema('Receipt').validate(receipt);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { price, quantity } = req.body;
    await idSchema('Product id').validate(_id);
    await productPriceSchema('Price').validate(price);
    await productUpdateQuantitySchema('Quantity').validate(quantity);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProductsBoosted = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedProductsBoosted = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
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
    const images = req.files?.filter(t => t.fieldname === 'images');

    await serviceImagesSchema('Images').validate(images);
    await serviceDisplayImageIndexSchema('Display image index').validate({ displayImageIndex, images });
    await serviceNameSchema('Name').validate(name);
    await serviceDescriptionSchema('Description').validate(description);
    await stringSchema('Country').validate(country);
    await stringSchema('State').validate(state);
    await stringSchema('City').validate(city);
    await servicePriceSchema('Price').validate(price);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const serviceBoostFreePlan = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Service id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const serviceBoostPaidPlanGoogle = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { purchaseToken, productId } = req.body;
    await idSchema('Service id').validate(_id);
    await stringSchema('Purchase token').validate(purchaseToken);
    await stringSchema('Product id').validate(productId);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const serviceBoostPaidPlanApple = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { receipt } = req.body;
    await idSchema('Service id').validate(_id);
    await stringSchema('Receipt').validate(receipt);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
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

//     await idSchema('Service id').validate(_id);
//     if (newImages?.length > 0) {
//       await serviceUpdateImagesSchema('New images').validate(newImages);
//     }

//     await serviceUpdateCurrentImagesSchema('Current images').validate(parsedCurrentImages);

//     await serviceUpdateImageLengthSchema('Images').validate({ currentImagesLength: parsedCurrentImages.length, newImagesLength: newImages?.length || 0 });

//     if (displayImageIndex && displayImageIndex !== '') {
//       await serviceUpdateDisplayImageIndexSchema('Display image index').validate(({ displayImageIndex, newImages, currentImages: parsedCurrentImages }));
//     }
//     await serviceNameSchema('Name').validate(name);
//     await serviceDescriptionSchema('Description').validate(description);
//     await stringSchema('Country').validate(country);
//     await stringSchema('State').validate(state);
//     await stringSchema('City').validate(city);
//     await servicePriceSchema('Price').validate(price);
//     next();
//   } catch (err) {
//     next({ ...err, status: 400 });
//   }
// };

export const updateService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { price } = req.body;
    await idSchema('Service id').validate(_id);
    await servicePriceSchema('Price').validate(price);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Service id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getServicesBoosted = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedServicesBoosted = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProductCategories = async (req, res, next) => {
  next();
};

//buyer routes
export const getHomeScreenProducts = async (req, res, next) => {
  next();
};

export const getHomeScreenSearchedProducts = async (req, res, next) => {
  try {
    const { name, category, subCategory, page } = req.query;
    if (!(name || category || subCategory || page)) {
      return nextError(next, 400, 'At least one of name, category, page or sub category is required.');
    }
    if (name !== '') {
      await stringSchema('Name').validate(name);
    }
    if (category !== '') {
      await stringSchema('Category').validate(category);
    }
    if (subCategory !== '') {
      await stringSchema('Sub Category').validate(subCategory);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getHomeScreenSearchedProductsHistory = async (req, res, next) => {
  next();
};

export const getHomeScreenServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getHomeScreenSearchedServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getHomeScreenSearchedServicesHistory = async (req, res, next) => {
  next();
};

export const addCartProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { fulfillmentMethod } = req.body;
    await idSchema('Product id').validate(_id);
    await cartProductFulfillmentMethodSchema('Fulfillment method').validate(fulfillmentMethod);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateCartProductIncrementByOne = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const updateCartProductDecrementByOne = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteCartProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const cartClearProduct = async (req, res, next) => {
  next();
};

export const getCartProducts = async (req, res, next) => {
  next();
};

export const cartProductVerify = async (req, res, next) => {
  next();
};

export const createOrderProductTransient = async (req, res, next) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    // if (deliveryAddress?.streetAddress !== '' || deliveryAddress?.apartment_suite !== '' || deliveryAddress?.country !== '' || deliveryAddress?.state !== '' || deliveryAddress?.city !== '' || deliveryAddress?.zipCode !== '') {
    //   await streetAddressSchema('Street address').validate(deliveryAddress?.streetAddress);
    //   if (deliveryAddress?.apartment_suite !== '') {
    //     await apartmentSuiteSchema('Apartment / Suit').validate(deliveryAddress?.apartment_suite);
    //   }
    //   await stringSchema('Country').validate(deliveryAddress?.country);
    //   await stringSchema('State').validate(deliveryAddress?.state);
    //   await stringSchema('City').validate(deliveryAddress?.city);
    //   if (deliveryAddress?.zipCode !== '') {
    //     await zipCodeSchema('Zip code').validate(deliveryAddress?.zipCode);
    //   }
    // }

    await cartProductPaymentMethod('Payment method').validate(paymentMethod);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const createOrderProductPurchased = async (req, res, next) => {
  next();
};

export const getOrderProductPurchasedCurrent = async (req, res, next) => {
  next();
};

export const getOrderProductPurchasedPast = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getOrderProductReceivedCurrent = async (req, res, next) => {
  next();
};

export const getOrderProductReceivedPast = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { _oid, _pid } = req.params;
    const { rating, description } = req.body;
    await idSchema('Order id').validate(_oid);
    await idSchema('Product id').validate(_pid);
    await productReviewRatingSchema('Rating').validate(rating);
    await productReviewDescriptionSchema('Description').validate(description);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getAllProductReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page, rating } = req.query;
    await idSchema('Product id').validate(_id);
    await pageSchema('Page').validate(page);
    if (rating != -1) {
      await productReviewRatingSchema("Rating").validate(rating);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSellerReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Seller id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getAllSellerReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page, rating } = req.query;
    await idSchema('Seller id').validate(_id);
    await pageSchema('Page').validate(page);
    if (rating != -1) {
      await productReviewRatingSchema("Rating").validate(rating);
    }
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSellerProducts = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('Seller id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSellerServices = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('Seller id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

//subscription routes
export const addWishlistProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteWishlistProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getWishlistProducts = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedWishlistProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const addWishlistService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Service id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deleteWishlistService = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Service id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getWishlistServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getSearchedWishlistServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    await stringSchema('Name').validate(name);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};
