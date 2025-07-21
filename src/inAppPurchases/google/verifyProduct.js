import { throwError } from '../../utils/index.js';
import { playDeveloperApiClient } from './index.js';

const verifyProduct = async (purchaseToken, productId) => {
  const res = await playDeveloperApiClient.purchases.products.get({
    packageName: process.env.PACKAGE_NAME,
    productId: productId,
    token: purchaseToken,
  });

  if (res.status !== 200) {
    throwError(400, "Status not ok.");
  }

  if (res.data.purchaseState !== 0) {
    throwError(409, 'Invalid or already consumed product.');
  }

  let name;
  let price;
  const purchasedAt = new Date(parseInt(res.data.purchaseTimeMillis, 10));
  let expiresAt;

  switch (productId) {
    case 'qs_7d':
      name = 'Quick Start';
      price = 28.99;
      expiresAt = new Date(purchasedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'ee_14d':
      name = 'Extended Exposure';
      price = 43.99;
      expiresAt = new Date(purchasedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      break;
    case 'mm_30d':
      name = 'Maximum Impact';
      price = 84.99;
      expiresAt = new Date(purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      name = `case not found - ${subscriptionId}`;
      price = -1;
  }

  const result = {
    name,
    price,
    purchasedAt,
    expiresAt,
  };

  return result;
};

export default verifyProduct;
