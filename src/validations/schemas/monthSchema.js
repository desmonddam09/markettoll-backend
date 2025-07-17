import * as yup from 'yup';

const monthSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .integer(`${name} must be an integer.`)
  .min(1, `${name} must be at least 1.`)
  .max(12, `${name} must be at max 12.`);

export default monthSchema;
