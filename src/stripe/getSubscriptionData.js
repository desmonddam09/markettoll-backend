const getSubscriptionData = (subscriptionName) => {
  let name;
  let price;
  let availablePostings;
  let availableBoosts;
  let wishlistFeature;

  switch (subscriptionName) {
    case 'Basic Plan':
      name = 'Basic Plan';
      price = 2.99;
      availablePostings = 2;
      availableBoosts = 1;
      wishlistFeature = false;
      break;
    case 'Standard Plan':
      name = 'Standard Plan';
      price = 5.99;
      availablePostings = 5;
      availableBoosts = 3;
      wishlistFeature = false;
      break;
    case 'Premium Plan':
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
