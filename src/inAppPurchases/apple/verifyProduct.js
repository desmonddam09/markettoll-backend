import { throwError } from '../../utils/index.js';
import getProductData from './getProductData.js';
import { AppleReceiptVerify } from './index.js';

const verifyProduct = async (receipt) => {
  const response = await AppleReceiptVerify.validate({ receipt: receipt });

  if (!response.length) {
    throwError(409, 'invalid or expired receipt.');
  }

  const transactionId = response[0].originalTransactionId;
  const productId = response[0].productId;
  const purchasedAt = new Date(response[0].purchaseDate);

  const data = getProductData(productId, purchasedAt);

  return {
    transactionId,
    productId,
    purchasedAt,
    name: data.name,
    price: data.price,
    expiresAt: data.expiresAt,
  };
};

export default verifyProduct;
