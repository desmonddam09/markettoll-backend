import mongoose from 'mongoose';
import { throwError } from '../utils/index.js';
import { productPickupAddress } from '../helpers/index.js';

const cartProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true,
    },
    fulfillmentMethod: {
      selfPickup: { type: Boolean, required: true },
      delivery: { type: Boolean, required: true },
    },
    quantity: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

cartProductSchema.index({ user: 1, product: 1 }, { unique: true });
cartProductSchema.index({ user: 1, createdAt: 1 });

cartProductSchema.statics.addUserCartProduct = async function (userId, productId, fulfillmentMethod) {
  const existingCartProduct = await this.findOne({ user: userId, product: productId });

  if (existingCartProduct) {
    throwError(409, 'Product already added to cart.');
  }

  const cartProduct = new this({
    user: userId,
    product: productId,
    fulfillmentMethod,
  });

  await cartProduct.save();
  return cartProduct;
};

cartProductSchema.statics.updateUserCartProductIncrementByOne = async function (userId, productId) {
  const updatedCartProduct = await this.findOneAndUpdate(
    { user: userId, product: productId },
    { $inc: { quantity: 1 } },
    { new: true }
  );

  if (!updatedCartProduct) {
    throwError(404, 'Product not found in cart.');
  }

  return updatedCartProduct;
};

cartProductSchema.statics.updateUserCartProductDecrementByOne = async function (userId, productId) {
  const updatedCartProduct = await this.findOneAndUpdate(
    { user: userId, product: productId, quantity: { $gt: 1 } },
    { $inc: { quantity: -1 } },
    { new: true }
  );

  if (!updatedCartProduct) {
    throwError(409, 'Product not found in cart or quantity is already at minimum.');
  }

  return updatedCartProduct;
};

cartProductSchema.statics.deleteUserCartProduct = async function (userId, productId) {
  const deletedCartProduct = await this.findOneAndDelete({ user: userId, product: productId });

  if (!deletedCartProduct) {
    throwError(404, 'Product not found in cart.');
  }

  return deletedCartProduct;
};

cartProductSchema.statics.deleteUserCart = async function (userId) {
  const deletedCartProducts = await this.deleteMany({ user: userId });;
  return deletedCartProducts;
};

cartProductSchema.statics.getUserCartProducts = async function (userId) {
  const cartProducts = await this.find({ user: userId })
    .populate({
      path: 'product',
      populate: {
        path: 'seller',
        model: 'user'
      }
    })
    .sort({ createdAt: 1 });

  const updateCartProducts = cartProducts.map(it => {
    if (it.product.fulfillmentMethod.selfPickup && !it.product.pickupAddress) {
      it.product.pickupAddress = productPickupAddress(it.product.seller.pickupAddress);
    }
    return it;
  });

  return updateCartProducts;
};

cartProductSchema.statics.userCartProductVerify = async function (userId) {
  const cartProductItems = await this.find({ user: userId })
    .populate('user')
    .populate({
      path: 'product',
      populate: {
        path: 'seller',
        model: 'user'
      }
    });

  if (!cartProductItems || cartProductItems.length === 0) {
    throwError(404, 'No items found in cart.');
  }

  for (const cartProductItem of cartProductItems) {
    if (!cartProductItem.user) {
      throwError(404, 'User not found');
    }
    if (!cartProductItem.product) {
      throwError(404, `Product not found.`);
    }
    if (!cartProductItem.product.seller) {
      throwError(404, `Product "${cartProductItem.product.name}" seller not found.`);
    }
    if (cartProductItem.product.seller._id.equals(userId)) {
      throwError(404, `User cannot purchase his own product "${cartProductItem.product.name}".`);
    }
    if (cartProductItem.product.seller.status !== 'active') {
      throwError(409, `Product "${cartProductItem.product.name}" seller status is not active.`);
    }
    if (cartProductItem.product.seller.adminStatus !== 'active') {
      throwError(409, `Product "${cartProductItem.product.name}" seller admin status is not active.`);
    }
    if (cartProductItem.product.country !== cartProductItem.user.address.country) {
      throwError(409, `User country does not match with product country for "${cartProductItem.product.name}".`);
    }
    // if (cartProductItem.product.state !== cartProductItem.user.address.state) {
    //   throwError(409, `User state does not match with product state for "${cartProductItem.product.name}".`);
    // }
    // if (cartProductItem.product.city !== cartProductItem.user.address.city) {
    //   throwError(409, `User city does not match with product city for "${cartProductItem.product.name}"`);
    // }
    if (cartProductItem.fulfillmentMethod.selfPickup && !cartProductItem.product.fulfillmentMethod.selfPickup) {
      throwError(409, `Self pickup is not available for product "${cartProductItem.product.name}"`);
    }
    if (cartProductItem.fulfillmentMethod.delivery && !cartProductItem.product.fulfillmentMethod.delivery) {
      throwError(409, `Delivery is not available for product "${cartProductItem.product.name}"`);
    }
    if (cartProductItem.quantity > cartProductItem.product.quantity) {
      throwError(409, `Only "${cartProductItem.product.quantity}" quantity is available for "${cartProductItem.product.name}"`);
    }
    if (cartProductItem.product.status !== 'active') {
      throwError(409, `Product "${cartProductItem.product.name}" status is not active.`);
    }
    if (cartProductItem.product.adminStatus === 'blocked') {
      throwError(409, `Product "${cartProductItem.product.name}" has been blocked by admin.`);
    }
  }
};

export default mongoose.model('cartProduct', cartProductSchema);
