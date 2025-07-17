import * as yup from 'yup';

const productUpdateQuantitySchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .integer(`${name} must be an integer.`)
  .min(0, `${name} must be greater than or equal to 0`);

export default productUpdateQuantitySchema;
