const getProductData = (productId, purchasedAt) => {
  let name;
  let price;
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
      expiresAt = new Date(purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      price = 84.99;
      break;
    default:
      name = `Plan not found - ${productId}`;
      price = -1;
  }

  return {
    name,
    price,
    expiresAt,
  };
};

export default getProductData;
