import admin from 'firebase-admin';
import { userModel, notificationModel, chatBlockedModel, productModel, serviceModel, wishlistProductModel, adminNotificationsModel } from '../models/index.js';
import throwError from './throwError.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  });
}

const buildMessage = (title, body, url, data, androidTokens, iosTokens, webTokens) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    android: {
      notification: {
        ...(url && { imageUrl: url })
      },
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body
          },
          sound: 'default',
          'content-available': 1,
          ...(url && { 'mutable-content': 1 })
        }
      },
      headers: {
        'apns-priority': '10',
      },
      fcm_options: {
        ...(url && { image: url })
      }
    },
    webpush: {
      headers: {
        Urgency: 'high',
        ...(url && { image: url })
      },
      notification: {
        title,
        body,
      }
    },
    tokens: [...androidTokens, ...iosTokens, ...webTokens],
  };

  return message;
};

export const sendCommonNotificationSingleUser = async (senderId, receiverId, title, attachments, body, data, pushNotificationTokens, save) => {
  const receiver = await userModel.findById(receiverId);
  if (!receiver) {
    throwError(404, 'Receiver not found.');
  }

  if (receiver.status === 'deleted') {
    throwError(403, 'Receiver has deleted his account.');
  }

  const notification = new notificationModel({
    type: senderId ? 'user-generated' : 'system-generated',
    sender: senderId,
    receiver: receiverId,
    title,
    attachments,
    body
  });

  if (save) {
    await notification.save();
  }

  if (!pushNotificationTokens?.length) {
    throwError(404, 'No push notification tokens available.');
  }

  const androidTokens = pushNotificationTokens
    .filter(token => token.platform === 'android')
    .map(token => token.token);

  const iosTokens = pushNotificationTokens
    .filter(token => token.platform === 'ios')
    .map(token => token.token);

  const webTokens = pushNotificationTokens
    .filter(token => token.platform === 'web')
    .map(token => token.token);

  const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

  await admin.messaging().sendEachForMulticast(message);

  return notification;
};

export const sendChatMessageNotification = async (senderId, receiverId, title, attachments, body) => {
  if (senderId.equals(receiverId)) {
    throwError(409, 'User cannot send notification to himself.');
  }

  const sender = await userModel.findById(senderId);
  if (!sender) {
    throwError(404, 'Sender not found.');
  }

  const receiver = await userModel.findById(receiverId);
  if (!receiver) {
    throwError(404, 'Receiver not found.');
  }

  if (receiver.status === 'deleted') {
    throwError(403, 'Receiver has deleted his account.');
  }

  if (!receiver.pushNotificationOptions.chatMessages) {
    throwError(409, 'User has turned off chat message notifications.');
  }

  const senderHasBlocked = await chatBlockedModel.findOne({ blocker: senderId, blockedUser: receiverId });
  if (senderHasBlocked) {
    throwError(403, 'You have blocked this user.');
  }

  const receiverHasBlocked = await chatBlockedModel.findOne({ blocker: receiverId, blockedUser: senderId });
  if (receiverHasBlocked) {
    throwError(403, 'Receiver has blocked you.');
  }

  const notification = new notificationModel({
    type: 'user-generated',
    sender: senderId,
    receiver: receiverId,
    title,
    attachments,
    body
  });

  // await notification.save();

  const pushNotificationTokens = receiver.pushNotificationTokens;
  if (!pushNotificationTokens?.length) {
    throwError(404, 'No push notification tokens available.');
  }

  const androidTokens = pushNotificationTokens
    .filter(token => token.platform === 'android')
    .map(token => token.token);

  const iosTokens = pushNotificationTokens
    .filter(token => token.platform === 'ios')
    .map(token => token.token);

  const webTokens = pushNotificationTokens
    .filter(token => token.platform === 'web')
    .map(token => token.token);

  const data = {
    type: 'chat',
    id: senderId.toString()
  };
  const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

  await admin.messaging().sendEachForMulticast(message);

  return notification;
};

export const sendCustomerSupportChatMessageNotification = async (senderId, receiverId, title, attachments, body) => {
  if (senderId.equals(receiverId)) {
    throwError(409, 'User cannot send notification to himself.');
  }

  const sender = await userModel.findById(senderId);
  if (!sender) {
    throwError(404, 'Sender not found.');
  }

  const receiver = await userModel.findById(receiverId);
  if (!receiver) {
    throwError(404, 'Receiver not found.');
  }

  if (receiver.status === 'deleted') {
    throwError(403, 'Receiver has deleted his account.');
  }

  if (!receiver.pushNotificationOptions.customerSupport) {
    throwError(409, 'User has turned off customer support chat message notifications.');
  }

  const senderHasBlocked = await chatBlockedModel.findOne({ blocker: senderId, blockedUser: receiverId });
  if (senderHasBlocked) {
    throwError(403, 'You have blocked this user.');
  }

  const receiverHasBlocked = await chatBlockedModel.findOne({ blocker: receiverId, blockedUser: senderId });
  if (receiverHasBlocked) {
    throwError(403, 'Receiver has blocked you.');
  }

  const notification = new notificationModel({
    type: 'user-generated',
    sender: senderId,
    receiver: receiverId,
    title,
    attachments,
    body
  });

  // await notification.save();

  const pushNotificationTokens = receiver.pushNotificationTokens;
  if (!pushNotificationTokens?.length) {
    throwError(404, 'No push notification tokens available.');
  }

  const androidTokens = pushNotificationTokens
    .filter(token => token.platform === 'android')
    .map(token => token.token);

  const iosTokens = pushNotificationTokens
    .filter(token => token.platform === 'ios')
    .map(token => token.token);

  const webTokens = pushNotificationTokens
    .filter(token => token.platform === 'web')
    .map(token => token.token);

  const data = {
    type: 'customer support'
  };

  const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

  await admin.messaging().sendEachForMulticast(message);

  return notification;
};

export const sendOrderReceivedNotification = async (senderId, orderId, receiverIds) => {
  const notifications = [];
  try {
    const sender = await userModel.findById(senderId);
    if (!sender) {
      throwError(404, 'User not found.');
    }

    for (const receiverId of receiverIds) {
      const receiver = await userModel.findById(receiverId);
      if (!receiver) {
        console.log(`${receiverId} not found.`);
        continue;
      }

      if (senderId.equals(receiverId)) {
        console.log('User cannot send notification to himself.');
        continue;
      }

      const title = 'New order received!';
      const attachments = [];
      const body = `${sender.name} has placed a new order.`;

      const notification = new notificationModel({
        type: 'user-generated',
        sender: senderId,
        receiver: receiverId,
        title,
        attachments,
        body
      });
      await notification.save();

      const pushNotificationTokens = receiver.pushNotificationTokens;
      if (!pushNotificationTokens?.length) {
        console.log(`${receiverId} push notification tokens not found.`);
        continue;
      }

      const androidTokens = pushNotificationTokens
        .filter(token => token.platform === 'android')
        .map(token => token.token);

      const iosTokens = pushNotificationTokens
        .filter(token => token.platform === 'ios')
        .map(token => token.token);

      const webTokens = pushNotificationTokens
        .filter(token => token.platform === 'web')
        .map(token => token.token);

      const data = {
        type: 'order received',
        id: orderId.toString()
      };

      const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

      await admin.messaging().sendEachForMulticast(message);

      notifications.push(notification);
    }
  } catch (err) {
    console.log(err);
  }
  return notifications;
};

export const sendProductReviewReceivedNotification = async (senderId, receiverId, productBoosted, productId) => {
  try {
    if (senderId.equals(receiverId)) {
      throwError(409, 'User cannot send notification to himself.');
    }

    const sender = await userModel.findById(senderId);
    if (!sender) {
      throwError(404, 'Sender not found.');
    }

    const receiver = await userModel.findById(receiverId);
    if (!receiver) {
      throwError(404, 'Receiver not found.');
    }

    if (receiver.status === 'deleted') {
      throwError(403, 'Receiver has deleted his account.');
    }

    const title = 'Product review received!';
    const attachments = [];
    const body = `${sender.name} has given a review.`;

    const notification = new notificationModel({
      type: 'user-generated',
      sender: senderId,
      receiver: receiverId,
      title,
      attachments,
      body
    });

    await notification.save();

    const pushNotificationTokens = receiver.pushNotificationTokens;
    if (!pushNotificationTokens?.length) {
      throwError(404, 'No push notification tokens available.');
    }

    const androidTokens = pushNotificationTokens
      .filter(token => token.platform === 'android')
      .map(token => token.token);

    const iosTokens = pushNotificationTokens
      .filter(token => token.platform === 'ios')
      .map(token => token.token);

    const webTokens = pushNotificationTokens
      .filter(token => token.platform === 'web')
      .map(token => token.token);

    const data = {
      type: 'product review received',
      id: productId.toString(),
      productBoosted
    };

    const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

    await admin.messaging().sendEachForMulticast(message);

    return notification;
  } catch (err) {
    console.log(err);
  }
};

export const sendProductBoostedNotification = async (productId) => {
  try {
    const product = await productModel.findById(productId);
    if (!product) {
      throwError(404, 'Product not found.');
    }

    const sender = await userModel.findById(product.seller);
    if (!sender) {
      throwError(404, 'Sender not found.');
    }

    const users = await userModel.find({
      _id: { $ne: product.seller },
      'address.country': product.country,
      'address.state': product.state,
      'address.city': product.city,
      'pushNotificationOptions.boostedProductsAndServices': true,
      status: { $ne: 'deleted' }
    });

    if (!users.length) {
      throwError(404, 'No user found in this area.');
    }

    const title = `${product.name} just got boosted!`;
    const attachments = [];
    const body = `Check out the newly boosted product: ${product.name}.`;

    for (const user of users) {
      const notification = new notificationModel({
        type: 'user-generated',
        sender: product.seller,
        receiver: user._id,
        title,
        attachments,
        body
      });

      // await notification.save();

      if (!user.pushNotificationTokens?.length) {
        console.log(`No push notification tokens available for ${user._id}`);
        continue;
      }

      const androidTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'android')
        .map(token => token.token);

      const iosTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'ios')
        .map(token => token.token);

      const webTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'web')
        .map(token => token.token);

      const data = {
        type: 'product boosted',
        id: productId.toString()
      };
      const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

      await admin.messaging().sendEachForMulticast(message).catch(err => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
};

export const sendServiceBoostedNotification = async (serviceId) => {
  try {
    const service = await serviceModel.findById(serviceId);
    if (!service) {
      throwError(404, 'Service not found.');
    }

    const sender = await userModel.findById(service.seller);
    if (!sender) {
      throwError(404, 'Sender not found.');
    }

    const users = await userModel.find({
      _id: { $ne: service.seller },
      'address.country': service.country,
      'address.state': service.state,
      'address.city': service.city,
      'pushNotificationOptions.boostedProductsAndServices': true,
      status: { $ne: 'deleted' }
    });

    if (!users.length) {
      throwError(404, 'No user found in this area.');
    }

    const title = `${service.name} just got boosted!`;
    const attachments = [];
    const body = `Check out the newly boosted service: ${service.name}.`;

    for (const user of users) {
      const notification = new notificationModel({
        type: 'user-generated',
        sender: service.seller,
        receiver: user._id,
        title,
        attachments,
        body
      });

      // await notification.save();

      if (!user.pushNotificationTokens?.length) {
        console.log(`No push notification tokens available for ${user._id}`);
        continue;
      }

      const androidTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'android')
        .map(token => token.token);

      const iosTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'ios')
        .map(token => token.token);

      const webTokens = user.pushNotificationTokens
        .filter(token => token.platform === 'web')
        .map(token => token.token);

      const data = {
        type: 'service boosted',
        id: serviceId.toString()
      };

      const message = buildMessage(title, body, attachments?.[0]?.url, data, androidTokens, iosTokens, webTokens);

      await admin.messaging().sendEachForMulticast(message).catch(err => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
};

export const sendWishlistItemBackInStock = async (productId) => {
  const wishlists = await wishlistProductModel.find({ product: productId }).populate('user').populate('product');

  if (!wishlists.length) {
    return;
  }

  for (const wishlist of wishlists) {
    try {
      if (!wishlist.user.pushNotificationOptions.wishlistItems) {
        continue;
      }
      await sendCommonNotificationSingleUser(null, wishlist.user._id, `${wishlist.product.name} is Back in Stock!`, [], `The product ${wishlist.product.name}, is now available again. Hurry before it's gone!`, { type: 'wishlist item back in stock', id: productId.toString() }, wishlist.user.pushNotificationTokens, false);
    } catch (err) {
      console.log(err);
    }
  }
};

export const sendAdminNotification = async (title, body) => {
  const now = new Date();
  const users = await userModel.find({ role: 'client' });
  await adminNotificationsModel.addNotification('instant', title, [], body, now, now);
  for (const x of users) {
    sendCommonNotificationSingleUser(null, x._id, title, [], body, {}, x.pushNotificationTokens, false).catch(err => { });
  }
};
