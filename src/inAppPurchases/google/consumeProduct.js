import { playDeveloperApiClient } from './index.js';

const consumeProduct = async (purchaseToken, productId) => {
  await playDeveloperApiClient.purchases.products.consume({
    packageName: process.env.PACKAGE_NAME,
    productId: productId,
    token: purchaseToken,
  });
};

export default consumeProduct;
