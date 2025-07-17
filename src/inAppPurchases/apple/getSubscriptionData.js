const getSubscriptionData = (productId) => {
  let name;
  let price;
  let availablePostings;
  let availableBoosts;
  let wishlistFeature;

  switch (productId) {
    case 'base1month':
      name = 'Basic Plan';
      price = 2.99;
      availablePostings = 2;
      availableBoosts = 1;
      wishlistFeature = false;
      break;
    case 'standard1month':
      name = 'Standard Plan';
      price = 5.99;
      availablePostings = 5;
      availableBoosts = 3;
      wishlistFeature = false;
      break;
    case 'premium1month':
      name = 'Premium Plan';
      price = 9.99;
      availablePostings = 10000;
      availableBoosts = 6;
      wishlistFeature = true;
      break;
    default:
      name = `Plan not found - ${productId}`;
      price = -1;
      availablePostings = -1;
      availableBoosts = -1;
      wishlistFeature = false;
  }

  return {
    name,
    price,
    availablePostings,
    availableBoosts,
    wishlistFeature
  };
};

export default getSubscriptionData;
