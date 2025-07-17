import * as yup from 'yup';

const subscriptionNameSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .oneOf(['Basic Plan', 'Standard Plan', 'Premium Plan'], `${name} must be one of 'Basic Plan', 'Standard Plan', or 'Premium Plan'.`);

export default subscriptionNameSchema;
