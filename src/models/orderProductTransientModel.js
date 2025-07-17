import mongoose from 'mongoose';
import { addressSchema, stripeCustomerSchema } from './schemas/index.js';
import productModel, { productSchema } from './productModel.js';

const orderProductTransientSchema = new mongoose.Schema(
  {
    placer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true,
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

orderProductTransientSchema.statics.restoreAllOrderProductTransient = async function () {
  const timeThreshold = new Date(Date.now() - 10 * 60 * 1000);
  const orders = await this.find({ createdAt: { $lte: timeThreshold } }).limit(100);

  if (!orders?.length) {
    return;
  }

  for (const order of orders) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const transientOrder = await this.findById(order._id).session(session);

      if (!transientOrder) {
        await session.commitTransaction();
        await session.endSession();
        continue;
      }

      for (const item of transientOrder.products) {
        const product = await productModel.findById(item.product._id).session(session);
        if (product) {
          product.quantity += item.quantity;
          product.quantitySold -= item.quantity;
          product.ordersReceived--;

          await product.save({ session });
        }
      }

      await transientOrder.deleteOne({ session });
      await session.commitTransaction();
      await session.endSession();

    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
    }
  }
};

orderProductTransientSchema.statics.restoreUserOrderProductTransient = async function (userId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userTransientOrder = await this.findOne({ placer: userId }).session(session);

    if (!userTransientOrder) {
      await session.commitTransaction();
      await session.endSession();
      return;
    }

    for (const item of userTransientOrder.products) {
      const product = await productModel.findById(item.product._id).session(session);
      if (product) {
        product.quantity += item.quantity;
        product.quantitySold -= item.quantity;
        product.ordersReceived--;

        await product.save({ session });
      }
    }

    await userTransientOrder.deleteOne({ session });
    await session.commitTransaction();
    await session.endSession();

  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

export default mongoose.model('orderProductTransient', orderProductTransientSchema);
