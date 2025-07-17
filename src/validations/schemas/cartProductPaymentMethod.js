import * as yup from 'yup';

const cartProductPaymentMethod = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .oneOf(['Pay via wallet', 'Card'], `${name} must be either "Pay via wallet" or "Card"`);

export default cartProductPaymentMethod;
