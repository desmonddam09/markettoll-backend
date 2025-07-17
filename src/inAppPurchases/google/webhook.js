import { productAndSubscriptionRevenueModel, userModel } from "../../models/index.js";
import { sendNotification, throwError } from "../../utils/index.js";
import verifySubscription from "./verifySubscription.js";
import acknowledgeSubscription from "./acknowledgeSubscription.js";

// const subscriptionPurchased = async (purchaseToken, subscriptionId) => {
//   const data = await verifySubscription(purchaseToken);
//   const user = await userModel.findOneAndUpdate(
//     {
//       'subscriptionPlan.transactionId': data.linkedPurchaseToken
//     },
//     {
//       $set: {
//         'subscriptionPlan.platform': 'google',
//         'subscriptionPlan.transactionId': purchaseToken,
//         'subscriptionPlan.name': data.name,
//         'subscriptionPlan.availablePostings': data.availablePostings,
//         'subscriptionPlan.availableBoosts': data.availableBoosts,
//         'subscriptionPlan.wishlistFeature': data.wishlistFeature,
//         'subscriptionPlan.renewedAt': null,
//         'subscriptionPlan.expiresAt': data.expiresAt,
//         'subscriptionPlan.status': 'active'
//       }
//     },
//     { new: true }
//   );

//   if (!user) {
//     throwError(404, 'User not found.');
//   }

//   await acknowledgeSubscription(purchaseToken, subscriptionId);
// };

const subscriptionRenewed = async (purchaseToken, subscriptionId) => {
  const date = new Date();
  const data = await verifySubscription(purchaseToken);
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': purchaseToken
    },
    {
      $set: {
        'subscriptionPlan.platform': 'google',
        'subscriptionPlan.transactionId': purchaseToken,
        'subscriptionPlan.name': data.name,
        'subscriptionPlan.availablePostings': data.availablePostings,
        'subscriptionPlan.availableBoosts': data.availableBoosts,
        'subscriptionPlan.wishlistFeature': data.wishlistFeature,
        'subscriptionPlan.renewedAt': date,
        'subscriptionPlan.expiresAt': data.expiresAt,
        'subscriptionPlan.status': 'active'
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }

  await acknowledgeSubscription(purchaseToken, subscriptionId);

  await productAndSubscriptionRevenueModel.addPurchase(user._id, 'google', purchaseToken, data.name, data.purchasedAt, date, data.expiresAt, data.price, null, 'subscription');
};

const subscriptionCancelled = async (purchaseToken) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': purchaseToken
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

  await productAndSubscriptionRevenueModel.cancelPurchase(purchaseToken);
};

const subscriptionGracePeriod = async (purchaseToken) => {
  const user = await userModel.findOne({ 'subscriptionPlan.transactionId': purchaseToken });
  await sendNotification.sendCommonNotificationSingleUser(null, user._id, 'Subscription Renewal Issue', [], 'There has been an issue with renewing your subscription.', {}, user.pushNotificationTokens, true);
};

const subscriptionRevoked = async (purchaseToken) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': purchaseToken
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
  await productAndSubscriptionRevenueModel.cancelPurchase(purchaseToken);
};


const pendingPurchaseCancelled = async (purchaseToken) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': purchaseToken
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
  await productAndSubscriptionRevenueModel.cancelPurchase(purchaseToken);
};

const webhook = async (req, res, next) => {
  try {
    const { message } = req.body;
    const decodedData = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));

    const { notificationType, purchaseToken, subscriptionId } = decodedData.subscriptionNotification;

    switch (notificationType) {
      case 1:
        //Subscription Recovered
        break;
      case 2:
        await subscriptionRenewed(purchaseToken, subscriptionId);
        break;
      case 3:
        await subscriptionCancelled(purchaseToken);
        break;
      case 4:
        // await subscriptionPurchased(purchaseToken, subscriptionId);
        break;
      case 5:
        //Subscription On Hold
        break;
      case 6:
        await subscriptionGracePeriod(purchaseToken);
        break;
      case 7:
        //Subscription Restarted
        break;
      case 8:
        //Subscription Price Changed
        break;
      case 9:
        //Subscription Deferred
        break;
      case 10:
        //Subscription Paused
        break;
      case 11:
        //Subscription Pause Schedule Changed
        break;
      case 12:
        await subscriptionRevoked(purchaseToken);
        break;
      case 13:
        //Subscription Expired
        break;
      case 20:
        await pendingPurchaseCancelled(purchaseToken);
        break;
      default:
        console.log('Notification type not handled', notificationType);
    }
  } catch (error) {
    console.log('Error processing Google webhook:', error);
  } finally {
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully.',
      data: null
    });
  }
};

export default webhook;
