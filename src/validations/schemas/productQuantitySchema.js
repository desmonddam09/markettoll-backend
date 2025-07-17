import * as yup from 'yup';

const productQuantitySchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .integer(`${name} must be an integer.`)
  .min(1, `${name} must be at least 1.`);

export default productQuantitySchema;
