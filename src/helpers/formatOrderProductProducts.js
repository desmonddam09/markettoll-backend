const formatOrderProductProducts = (products, _doc) => {

  const groupedProducts = products.reduce((acc, product) => {
    const sellerId = product.product.seller._id.toString();
    const phoneNumber = product.product.seller.phoneNumber;
    const name = product.product.seller.name;
    const fulfillmentType = product.fulfillmentMethod.selfPickup ? 'selfPickup' : 'delivery';
    let p2;
    if (_doc) {
      p2 = { ...product, hasReviewed: false };
    } else {
      p2 = { ...product._doc, hasReviewed: false };
    }
    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerId,
        phoneNumber,
        name,
        selfPickup: [],
        delivery: []
      };
    }

    acc[sellerId][fulfillmentType].push(p2);

    return acc;
  }, {});

  const formattedProducts = Object.entries(groupedProducts).map(([sellerId, sellerInfo]) => ({
    seller: {
      id: sellerId,
      name: sellerInfo.name,
      phoneNumber: sellerInfo.phoneNumber
    },
    fulfillmentMethods: Object.entries(sellerInfo).filter(([key]) => key === 'selfPickup' || key === 'delivery').map(([method, products]) => ({
      method,
      products
    }))
  }));

  return formattedProducts;
};

export default formatOrderProductProducts;
