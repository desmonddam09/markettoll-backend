import mongoose from 'mongoose';
import { getSubscriptionData, stripe } from './index.js';
import { sendNotification, throwError } from '../utils/index.js';
import { orderProductTransientModel, orderProductPurchasedModel, cartProductModel, fundsAddedToWalletModel, transactionHistoryModel, userModel, productBoostStripeModel, productModel, serviceBoostStripeModel, serviceModel, calculateStripeAdminProfitsModel, productAndSubscriptionRevenueModel, subscriptionStripeModel } from '../models/index.js';

const paymentIntentSucceeded = async (event) => {
  const account = event;
  const receiverIds = [];
  const transfers = [];
  const productOutOfStock = [];
  let orderSuccess = null;
  let addFundsSuccess = null;
  let prodBoosted = null;
  let servBoosted = null;

  try {
    orderSuccess = await orderProductTransientModel.findOne({ paymentIntentId: account.data.object.id });
    addFundsSuccess = await fundsAddedToWalletModel.findOne({ paymentIntentId: account.data.object.id });
    prodBoosted = await productBoostStripeModel.findOne({ paymentIntentId: account.data.object.id });
    servBoosted = await serviceBoostStripeModel.findOne({ paymentIntentId: account.data.object.id });
  } catch (err) {
    console.log(err);
  }

  if (orderSuccess) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const orderProductTransient = await orderProductTransientModel.findOne({ paymentIntentId: account.data.object.id }).populate('products.product.seller').session(session);

      if (!orderProductTransient) {
        throwError(404, 'User does not have a transient order.');
      }

      orderProductTransient.products.forEach(it => {
        const index = transfers.findIndex(it2 => it2.sellerId === it.product.seller._id);
        if (index !== -1) {
          transfers[index] = { sellerId: transfers[index].sellerId, connectedAccountId: transfers[index].connectedAccountId, amount: transfers[index].amount + (it.product.price * it.quantity) };
        } else {
          transfers.push({ sellerId: it.product.seller._id, connectedAccountId: it.product.seller.stripeConnectedAccount.id, amount: it.product.price * it.quantity });
        }
      });

      const amount = orderProductTransient.products.reduce((sum, product) => sum + (product.product.price * product.quantity), 0);

      transfers.forEach(transfer => {
        transfer.amount -= (transfer.amount * orderProductTransient.platformFee).toFixed(2);
      });

      const amountTransferred = (amount - (amount * orderProductTransient.platformFee)).toFixed(2);

      const orderProductPurchased = new orderProductPurchasedModel({
        placer: orderProductTransient.placer,
        deliveryAddress: orderProductTransient.deliveryAddress,
        paymentIntentId: orderProductTransient.paymentIntentId,
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
      await cartProductModel.deleteMany({ user: orderProductTransient.placer }).session(session);

      const promises = transfers.map(async (it) => {
        const seller = await userModel.findById(it.sellerId).session(session);
        seller.walletBalance += it.amount;
        seller.walletBalance = parseFloat(seller.walletBalance.toFixed(2));
        await seller.save({ session });
      });
      await Promise.all(promises);

      const abc = new calculateStripeAdminProfitsModel({ paymentIntentId: account.data.object.id, transferAmount: amountTransferred });
      await abc.save({ session });

      sendNotification.sendOrderReceivedNotification(orderProductTransient.placer, orderProductPurchased._id, receiverIds).catch(err => console.log(err));
      for (const product of productOutOfStock) {
        sendNotification.sendCommonNotificationSingleUser(null, product.product.seller._id, `${product.product.name} is out of stock`, [], `Your product ${product.product.name} is out of stock.`, { type: 'product out of stock', id: product.product._id.toString(), boosted: product.boosted }, product.product.seller.pushNotificationTokens, true).catch(err => console.log(err));
      }

      await session.commitTransaction();
      await session.endSession();
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      console.log(err);
    }
  }
  else if (addFundsSuccess) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const f = await fundsAddedToWalletModel.findOne({ paymentIntentId: account.data.object.id }).session(session);

      if (!f) {
        throwError(404, 'Funds not found.');
      }

      const user = await userModel.findById(f.user).session(session);

      if (!user) {
        throwError(404, 'User not found.');
      }

      const deductedAmount = (account.data.object.amount / 100) - (((account.data.object.amount / 100) * parseFloat(process.env.STRIPE_FEE_BASE_PERCENTAGE)) + parseFloat(process.env.STRIPE_FEE_BASE_AMOUNT));
      user.walletBalance += deductedAmount;
      user.walletBalance = parseFloat(user.walletBalance.toFixed(2));
      await user.save({ session });

      const transaction = new transactionHistoryModel({
        user: f.user,
        type: 'credit',
        amount: account.data.object.amount / 100
      });
      await transaction.save({ session });
      await f.deleteOne({ session });

      await session.commitTransaction();
      await session.endSession();
      return user.walletBalance;
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      throw err;
    }
  }
  else if (prodBoosted) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const a = await productBoostStripeModel.findOne({ paymentIntentId: account.data.object.id }).session(session);
      if (!a) {
        throwError(404, 'Product boost data not found.');
      }
      const b = await userModel.findById(a.user).session(session);
      if (!b) {
        throwError(404, 'User not found.');
      }
      const c = await productModel.findById(a.product).session(session);
      if (!c) {
        throwError(404, 'Product not found.');
      }
      if (!c.seller.equals(a.user)) {
        throwError(409, 'User does not own this product.');
      }
      if (c.status !== 'active') {
        throwError(409, 'Product is not active.');
      }
      if (c.adminStatus === 'blocked') {
        throwError(409, 'Product has been blocked by admin.');
      }
      if (c.boostPlan.name !== 'No Plan') {
        throwError(409, 'Product is already boosted.');
      }

      const purchasedAt = new Date();
      let expiresAt;

      switch (a.boostName) {
        case 'Quick Start':
          expiresAt = new Date(purchasedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'Extended Exposure':
          expiresAt = new Date(purchasedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'Maximum Impact':
          expiresAt = new Date(purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      c.boostPlan.transactionId = a.paymentIntentId;
      c.boostPlan.name = a.boostName;
      c.boostPlan.purchasedAt = purchasedAt;
      c.boostPlan.expiresAt = expiresAt;

      const abc = new calculateStripeAdminProfitsModel({ paymentIntentId: account.data.object.id, transferAmount: 0 });
      await abc.save({ session });

      const purchaseTicket = new productAndSubscriptionRevenueModel({
        user: a.user,
        platform: 'stripe',
        transactionId: a.paymentIntentId,
        name: a.boostName,
        purchasedAt: purchasedAt,
        renewedAt: null,
        expiresAt: expiresAt,
        price: (account.data.object.amount / 100).toFixed(2),
        cancelledAt: null,
        type: 'product',
      });

      await purchaseTicket.save({ session });

      await c.save({ session });
      await a.deleteOne({ session });
      await session.commitTransaction();
      await session.endSession();

    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      throw err;
    }
  }
  else if (servBoosted) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const a = await serviceBoostStripeModel.findOne({ paymentIntentId: account.data.object.id }).session(session);
      if (!a) {
        throwError(404, 'Service boost data not found.');
      }
      const b = await userModel.findById(a.user).session(session);
      if (!b) {
        throwError(404, 'User not found.');
      }
      const c = await serviceModel.findById(a.service).session(session);
      if (!c) {
        throwError(404, 'Service not found.');
      }
      if (!c.seller.equals(a.user)) {
        throwError(409, 'User does not own this service.');
      }
      if (c.status !== 'active') {
        throwError(409, 'Service is not active.');
      }
      if (c.boostPlan.name !== 'No Plan') {
        throwError(409, 'Service is already boosted.');
      }

      const purchasedAt = new Date();
      let expiresAt;

      switch (a.boostName) {
        case 'Quick Start':
          expiresAt = new Date(purchasedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'Extended Exposure':
          expiresAt = new Date(purchasedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case 'Maximum Impact':
          expiresAt = new Date(purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      c.boostPlan.transactionId = a.paymentIntentId;
      c.boostPlan.name = a.boostName;
      c.boostPlan.purchasedAt = purchasedAt;
      c.boostPlan.expiresAt = expiresAt;

      const abc = new calculateStripeAdminProfitsModel({ paymentIntentId: account.data.object.id, transferAmount: 0 });
      await abc.save({ session });

      const purchaseTicket = new productAndSubscriptionRevenueModel({
        user: a.user,
        platform: 'stripe',
        transactionId: a.paymentIntentId,
        name: a.boostName,
        purchasedAt: purchasedAt,
        renewedAt: null,
        expiresAt: expiresAt,
        price: (account.data.object.amount / 100).toFixed(2),
        cancelledAt: null,
        type: 'product',
      });

      await purchaseTicket.save({ session });

      await c.save({ session });
      await a.deleteOne({ session });
      await session.commitTransaction();
      await session.endSession();

    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      throw err;
    }
  }
  else if (event.data.object.description === 'Subscription update') {
    const abc = new calculateStripeAdminProfitsModel({ paymentIntentId: account.data.object.id, transferAmount: 0 });
    await abc.save();
  }
};

const paymentMethodDetached = async (event) => {
  const account = event.data.object;
  const user = await userModel.findOneAndUpdate(
    {
      'stripeCustomer.paymentMethod.id': account.id
    },
    {
      $set: {
        'stripeCustomer.paymentMethod.id': null,
        'stripeCustomer.paymentMethod.brand': '',
        'stripeCustomer.paymentMethod.exp_month': '',
        'stripeCustomer.paymentMethod.exp_year': '',
        'stripeCustomer.paymentMethod.last4': '',
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }
};

const customerDeleted = async (event) => {
  const account = event.data.object;
  const user = await userModel.findOneAndUpdate(
    {
      'stripeCustomer.id': account.id
    },
    {
      $set: {
        'stripeCustomer.id': null,
        'stripeCustomer.paymentMethod.id': null,
        'stripeCustomer.paymentMethod.brand': '',
        'stripeCustomer.paymentMethod.exp_month': '',
        'stripeCustomer.paymentMethod.exp_year': '',
        'stripeCustomer.paymentMethod.last4': '',
      }
    },
    { new: true }
  );

  if (!user) {
    throwError(404, 'User not found.');
  }
};

const customerSubscriptionDeleted = async (event) => {
  const date = new Date();
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  const user = await userModel.findOneAndUpdate(
    {
      'subscriptionPlan.transactionId': event.data.object.id
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

  await productAndSubscriptionRevenueModel.cancelPurchase(event.data.object.id);

};

const customerSubscriptionUpdated = async (event) => {
  if (event.data.object.status !== 'active') {
    throwError(409, 'Subscription not active.');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const stripeSubscriptionDoc = await subscriptionStripeModel.findOne({ subscriptionId: event.data.object.id }).session(session);
    if (stripeSubscriptionDoc) {
      const user = await userModel.findById(stripeSubscriptionDoc.user).session(session);
      if (!user) {
        throwError(404, 'User not found.');
      }
      const subscriptionData = getSubscriptionData(stripeSubscriptionDoc.subscriptionName);

      user.subscriptionPlan.platform = 'stripe';
      user.subscriptionPlan.transactionId = event.data.object.id;
      user.subscriptionPlan.name = subscriptionData.name;
      user.subscriptionPlan.availablePostings = subscriptionData.availablePostings;
      user.subscriptionPlan.availableBoosts = subscriptionData.availableBoosts;
      user.subscriptionPlan.wishlistFeature = subscriptionData.wishlistFeature;
      user.subscriptionPlan.purchasedAt = new Date(event.data.object.current_period_start * 1000);
      user.subscriptionPlan.renewedAt = null;
      user.subscriptionPlan.expiresAt = new Date(event.data.object.current_period_end * 1000);
      user.subscriptionPlan.status = 'active';
      await user.save({ session });

      const abc = new calculateStripeAdminProfitsModel({ paymentIntentId: stripeSubscriptionDoc.paymentIntentId, transferAmount: 0 });
      await abc.save({ session });
      const purchaseTicket = new productAndSubscriptionRevenueModel({
        user: user._id,
        platform: 'stripe',
        transactionId: event.data.object.id,
        name: subscriptionData.name,
        purchasedAt: new Date(event.data.object.current_period_start * 1000),
        renewedAt: null,
        expiresAt: new Date(event.data.object.current_period_end * 1000),
        price: subscriptionData.price,
        cancelledAt: null,
        type: 'subscription',
      });

      await purchaseTicket.save({ session });
      await stripeSubscriptionDoc.deleteOne({ session });
    } else {
      const user = await userModel.findOne({ 'subscriptionPlan.transactionId': event.data.object.id }).session(session);
      if (!user) {
        throwError(404, 'User not found.');
      }
      const subscriptionData = getSubscriptionData(user.subscriptionPlan.name);

      user.subscriptionPlan.availablePostings = subscriptionData.availablePostings;
      user.subscriptionPlan.availableBoosts = subscriptionData.availableBoosts;
      user.subscriptionPlan.wishlistFeature = subscriptionData.wishlistFeature;
      user.subscriptionPlan.renewedAt = new Date(event.data.object.current_period_start * 1000);
      user.subscriptionPlan.expiresAt = new Date(event.data.object.current_period_end * 1000);
      user.subscriptionPlan.status = 'active';
      await user.save({ session });

      const purchaseTicket = new productAndSubscriptionRevenueModel({
        user: user._id,
        platform: 'stripe',
        transactionId: event.data.object.id,
        name: subscriptionData.name,
        purchasedAt: user.subscriptionPlan.purchasedAt,
        renewedAt: new Date(event.data.object.current_period_start * 1000),
        expiresAt: new Date(event.data.object.current_period_end * 1000),
        price: subscriptionData.price,
        cancelledAt: null,
        type: 'subscription',
      });

      await purchaseTicket.save({ session });
    }

    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

const webhookAccount = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];

    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_ACCOUNT);

    if ((process.env.NODE_ENV === 'development' && !event.livemode) || (process.env.NODE_ENV === 'staging' && !event.livemode) || (process.env.NODE_ENV === 'production' && event.livemode)) {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await paymentIntentSucceeded(event);
          break;
        case 'payment_method.detached':
          await paymentMethodDetached(event);
          break;
        case 'customer.deleted':
          await customerDeleted(event);
          break;
        case 'customer.subscription.deleted':
          await customerSubscriptionDeleted(event);
          break;
        case 'customer.subscription.updated':
          await customerSubscriptionUpdated(event);
          break;
        // default:
        // console.log(`Unhandled account event type ${event.type}`);
      }
    }
  } catch (err) {
    console.log('Stripe account webhook error', err);
  } finally {
    res.status(200).json({
      success: true,
      message: 'Stripe account webhook event received successfully.',
      data: null
    });
  }
};

export default webhookAccount;
