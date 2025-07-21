import { productAndSubscriptionRevenueModel, userModel } from "../../models/index.js";
import { sendNotification, throwError } from "../../utils/index.js";
import jwt from 'jsonwebtoken';
import getSubscriptionData from "./getSubscriptionData.js";

const subscriptionRenewal = async (data) => {
  const data2 = getSubscriptionData(data.productId);
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'apple',
        'subscriptionPlan.transactionId': data.originalTransactionId,
        'subscriptionPlan.name': data2.name,
        'subscriptionPlan.availablePostings': data2.availablePostings,
        'subscriptionPlan.availableBoosts': data2.availableBoosts,
        'subscriptionPlan.wishlistFeature': data2.wishlistFeature,
        'subscriptionPlan.renewedAt': new Date(data.purchaseDate),
        'subscriptionPlan.expiresAt': new Date(data.expiresDate),
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.addPurchase(user._id, 'apple', data.originalTransactionId, data2.name, new Date(data.originalPurchaseDate), new Date(data.purchaseDate), new Date(data.expiresDate), data2.price, null, 'subscription');
};

const interactiveRenewal = async (data) => {
  const data2 = getSubscriptionData(data.productId);
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'apple',
        'subscriptionPlan.transactionId': data.originalTransactionId,
        'subscriptionPlan.name': data2.name,
        'subscriptionPlan.availablePostings': data2.availablePostings,
        'subscriptionPlan.availableBoosts': data2.availableBoosts,
        'subscriptionPlan.wishlistFeature': data2.wishlistFeature,
        'subscriptionPlan.renewedAt': new Date(data.purchaseDate),
        'subscriptionPlan.expiresAt': new Date(data.expiresDate),
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.addPurchase(user._id, 'apple', data.originalTransactionId, data2.name, new Date(data.originalPurchaseDate), new Date(data.purchaseDate), new Date(data.expiresDate), data2.price, null, 'subscription');
};

const didRecover = async (data) => {
  const data2 = getSubscriptionData(data.productId);
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'apple',
        'subscriptionPlan.transactionId': data.originalTransactionId,
        'subscriptionPlan.name': data2.name,
        'subscriptionPlan.availablePostings': data2.availablePostings,
        'subscriptionPlan.availableBoosts': data2.availableBoosts,
        'subscriptionPlan.wishlistFeature': data2.wishlistFeature,
        'subscriptionPlan.renewedAt': new Date(data.purchaseDate),
        'subscriptionPlan.expiresAt': new Date(data.expiresDate),
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.addPurchase(user._id, 'apple', data.originalTransactionId, data2.name, new Date(data.originalPurchaseDate), new Date(data.purchaseDate), new Date(data.expiresDate), data2.price, null, 'subscription');
};

const subscriptionCancel = async (data) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'none',
        'subscriptionPlan.transactionId': null,
        'subscriptionPlan.name': 'Free Plan',
        'subscriptionPlan.availablePostings': 1,
        'subscriptionPlan.availableBoosts': 0,
        'subscriptionPlan.wishlistFeature': false,
        'subscriptionPlan.purchasedAt': date,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': nextMonth,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.cancelPurchase(data.originalTransactionId);
};

const subscriptionChange = async (data, subType) => {
  if (subType === 'UPGRADE') {
    const data2 = getSubscriptionData(data.productId);
    const user = await userModel.findOneAndUpdate(
      {
        'subscriptionPlan.transactionId': data.originalTransactionId
      },
      {
        $set: {
          'subscriptionPlan.platform': 'apple',
          'subscriptionPlan.transactionId': data.originalTransactionId,
          'subscriptionPlan.name': data2.name,
          'subscriptionPlan.availablePostings': data2.availablePostings,
          'subscriptionPlan.availableBoosts': data2.availableBoosts,
          'subscriptionPlan.wishlistFeature': data2.wishlistFeature,
          'subscriptionPlan.renewedAt': new Date(data.purchaseDate),
          'subscriptionPlan.expiresAt': new Date(data.expiresDate),
          'subscriptionPlan.status': 'active'
        }
      },
      { new: true }
    );

    if (!user) {
      throwError(404, 'User not found.');
    }

    await productAndSubscriptionRevenueModel.addPurchase(user._id, 'apple', data.originalTransactionId, data2.name, new Date(data.originalPurchaseDate), new Date(data.purchaseDate), new Date(data.expiresDate), data2.price, null, 'subscription');
  }
};

const didChangeRenewalStatus = async (data) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'none',
        'subscriptionPlan.transactionId': null,
        'subscriptionPlan.name': 'Free Plan',
        'subscriptionPlan.availablePostings': 1,
        'subscriptionPlan.availableBoosts': 0,
        'subscriptionPlan.wishlistFeature': false,
        'subscriptionPlan.purchasedAt': date,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': nextMonth,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.cancelPurchase(data.originalTransactionId);
};

const revoke = async (data) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'none',
        'subscriptionPlan.transactionId': null,
        'subscriptionPlan.name': 'Free Plan',
        'subscriptionPlan.availablePostings': 1,
        'subscriptionPlan.availableBoosts': 0,
        'subscriptionPlan.wishlistFeature': false,
        'subscriptionPlan.purchasedAt': date,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': nextMonth,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.cancelPurchase(data.originalTransactionId);
};

const expired = async (data) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'none',
        'subscriptionPlan.transactionId': null,
        'subscriptionPlan.name': 'Free Plan',
        'subscriptionPlan.availablePostings': 1,
        'subscriptionPlan.availableBoosts': 0,
        'subscriptionPlan.wishlistFeature': false,
        'subscriptionPlan.purchasedAt': date,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': nextMonth,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }
};

const refund = async (data) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': data.originalTransactionId
    },
    {
      $set: {
        'subscriptionPlan.platform': 'none',
        'subscriptionPlan.transactionId': null,
        'subscriptionPlan.name': 'Free Plan',
        'subscriptionPlan.availablePostings': 1,
        'subscriptionPlan.availableBoosts': 0,
        'subscriptionPlan.wishlistFeature': false,
        'subscriptionPlan.purchasedAt': date,
        'subscriptionPlan.renewedAt': null,
        'subscriptionPlan.expiresAt': nextMonth,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await productAndSubscriptionRevenueModel.cancelPurchase(data.originalTransactionId);
};

const failedToRenew = async (data) => {
  const user = await userModel.findOne({ 'subscriptionPlan.transactionId': data.originalTransactionId });
  await sendNotification.sendCommonNotificationSingleUser(null, user._id, 'Subscription Renewal Issue', [], 'There has been an issue with renewing your subscription.', {}, user.pushNotificationTokens, true);
};

const webhook = async (req, res, next) => {
  const decodedPayload = jwt.decode(req.body.signedPayload);
  const notificationType = decodedPayload.notificationType;
  const subType = decodedPayload.subtype;
  const decodedPayload2 = jwt.decode(decodedPayload.data.signedTransactionInfo);

  try {
    switch (notificationType) {
      case 'DID_RENEW':
        await subscriptionRenewal(decodedPayload2);
        break;
      case 'INTERACTIVE_RENEWAL':
        await interactiveRenewal(decodedPayload2);
        break;
      case 'DID_RECOVER':
        await didRecover(decodedPayload2);
        break;
      case 'CANCEL':
        await subscriptionCancel(decodedPayload2);
        break;
      case 'DID_CHANGE_RENEWAL_PREF':
        await subscriptionChange(decodedPayload2, subType);
        break;
      case 'DID_CHANGE_RENEWAL_STATUS':
        // await didChangeRenewalStatus(decodedPayload2);
        break;
      case 'REVOKE':
        await revoke(decodedPayload2);
        break;
      case 'EXPIRED':
        await expired(decodedPayload2);
        break;
      case 'REFUND':
        await refund(decodedPayload2);
        break;
      case 'DID_FAIL_TO_RENEW':
        await failedToRenew(decodedPayload2);
        break;
      // default:
      // console.log(`Unhandled notification type: ${notificationType}`);
    }
  } catch (error) {
    console.error('Error processing Apple webhook:', error);
  } finally {
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully.',
      data: null
    });
  }
};

export default webhook;
