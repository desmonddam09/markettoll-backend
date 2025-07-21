
import { AppleReceiptVerify } from './index.js';
import { throwError } from '../../utils/index.js';
import getSubscriptionData from './getSubscriptionData.js';

const verifySubscription = async (receipt) => {
  const response = await AppleReceiptVerify.validate({ receipt: receipt });

  if (!response.length) {
    throwError(409, 'invalid or expired receipt.');
  }

  const transactionId = response[0].originalTransactionId;
  const productId = response[0].productId;
  const purchasedAt = new Date(response[0].purchaseDate);
  const expiresAt = new Date(response[0].expirationDate);

  const data = getSubscriptionData(productId);

  return {
    transactionId,
    productId,
    purchasedAt,
    expiresAt,
    name: data.name,
    price: data.price,
    availablePostings: data.availablePostings,
    availableBoosts: data.availableBoosts,
    wishlistFeature: data.wishlistFeature,
  };
};

export default verifySubscription;
