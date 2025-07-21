import { activeBoostFilterSchema, activeSubscriptionFilterSchema, addFundsAmountSchema, categoryImageSchema, dateISOStringSchema, idSchema, monthSchema, pageSchema, stringSchema, subcategoryAndImagesLengthSchema, subcategoryImagesSchema, subcategoryNamesSchema, yearSchema } from "./schemas/index.js";

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

export const getReportedUsers = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const notification = async (req, res, next) => {
  try {
    const { scheduleDate, title, body } = req.body;
    if (scheduleDate !== '') {
      await dateISOStringSchema('Schedule date').validate(scheduleDate);
    }
    await stringSchema('Title').validate(title);
    await stringSchema('Body').validate(body);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getNotification = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getDeletedAccounts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { name, category, subCategory, page } = req.query;
    if (name) {
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

export const getPendingReviewProducts = async (req, res, next) => {
  try {
    const { name, category, subCategory, page } = req.query;
    if (name) {
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

export const getPendingReviewServices = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getDeactivatedProducts = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('User id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('User id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const addCategory = async (req, res, next) => {
  try {
    const images = req.files?.filter(t => t.fieldname === 'images');
    const { categoryName } = req.body;

    await categoryImageSchema('Images').validate(images);
    await stringSchema('Category Name').validate(categoryName);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const addSubcategory = async (req, res, next) => {
  try {
    const images = req.files?.filter(t => t.fieldname === 'images');
    const { categoryName, subcategoryNames } = req.body;

    await subcategoryImagesSchema('Images').validate(images);
    await stringSchema('Category Name').validate(categoryName);
    await subcategoryNamesSchema('Subcategory Names').validate(subcategoryNames ? JSON.parse(subcategoryNames) : []);
    await subcategoryAndImagesLengthSchema('subcategory names').validate({ imagesLength: images.length, subcategoryNamesLength: JSON.parse(subcategoryNames).length });
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const createPayoutProfits = async (req, res, next) => {
  try {
    const { amount } = req.body;
    await addFundsAmountSchema('Amount').validate(amount);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const emailSupportReply = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { body } = req.body;
    await idSchema('Email support request id').validate(_id);
    await stringSchema('Body').validate(body);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const emailSupportCloseTicket = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Email support request id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const activeSubscriptions = async (req, res, next) => {
  try {
    const { subscription, page } = req.query;
    if (subscription !== '-1') {
      await activeSubscriptionFilterSchema('subscription').validate(subscription);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const activeBoosts = async (req, res, next) => {
  try {
    const { boost, page } = req.query;
    if (boost !== '-1') {
      await activeBoostFilterSchema('boost').validate(boost);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const yearlyOrders = async (req, res, next) => {
  try {
    const { year } = req.query;
    await yearSchema('Year').validate(year);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const yearlySubscriptionRevenue = async (req, res, next) => {
  try {
    const { year } = req.query;
    await yearSchema('Year').validate(year);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const emailSupportRequest = async (req, res, next) => {
  try {
    const { name, page } = req.query;
    if (name) {
      await stringSchema('Name').validate(name);
    }
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const blockedUsers = async (req, res, next) => {
  try {
    const { page } = req.query;
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const deactivateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const activateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;
    await idSchema('Product id').validate(_id);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const productReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('Product id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const productOrders = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('Product id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userOrders = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('User id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userSubscriptions = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('User id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userListings = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('User id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userListingsBoosted = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('User id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userReviews = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const { page } = req.query;
    await idSchema('User id').validate(_id);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const usersRegisteredInMonth = async (req, res, next) => {
  try {
    const { month, year, page } = req.query;
    await monthSchema('Month').validate(month);
    await yearSchema('Year').validate(year);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};

export const userSubscriptionsInMonth = async (req, res, next) => {
  try {
    const { month, year, page } = req.query;
    await monthSchema('Month').validate(month);
    await yearSchema('Year').validate(year);
    await pageSchema('Page').validate(page);
    next();
  } catch (err) {
    next({ ...err, status: 400 });
  }
};
