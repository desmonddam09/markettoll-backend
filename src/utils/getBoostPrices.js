const getBoostPrices = (name) => {
  let price;
  switch (name) {
    case 'No Plan':
      price = 0;
      break;
    case 'Free Plan':
      price = 0;
      break;
    case 'Quick Start':
      price = 28.99;
      break;
    case 'Extended Exposure':
      price = 43.99;
      break;
    case 'Maximum Impact':
      price = 84.99;
      break;
  }

  return price;
};

export default getBoostPrices;
