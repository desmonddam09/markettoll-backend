import * as yup from 'yup';

const activeSubscriptionFilterSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .integer(`${name} must be an integer.`)
  .min(1, `${name} must be at least 1.`)
  .max(5, `${name} must be at max 5.`);

export default activeSubscriptionFilterSchema;
