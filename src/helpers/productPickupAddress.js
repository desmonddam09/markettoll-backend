const productPickupAddress = (address) => {
  let modifiedAddress = `${address.streetAddress}`;
  if (address.apartment_suite) {
    modifiedAddress += `, ${address.apartment_suite}`;
  }
  modifiedAddress += `, ${address.city}`;
  modifiedAddress += `, ${address.state}`;
  modifiedAddress += `, ${address.country}`;

  return modifiedAddress;
};

export default productPickupAddress;
