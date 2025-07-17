const getSubscriptionPrices = (name) => {
  let price;
  switch (name) {
    case 'No Plan':
      price = 0;
      break;
    case 'Free Plan':
      price = 0;
      break;
    case 'Basic Plan':
      price = 2.99;
      break;
    case 'Standard Plan':
      price = 5.99;
      break;
    case 'Premium Plan':
      price = 9.99;
      break;
  }

  return price;
};

export default getSubscriptionPrices;
