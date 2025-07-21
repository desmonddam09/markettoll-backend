import { stripe } from './index.js';

const createCustomer = async (name, email) => {
  const n = name || 'default';
  const e = email || 'default@gmail.com';

  const customer = await stripe.customers.create({ name: n, email: e });
  return customer;
};

export default createCustomer;
