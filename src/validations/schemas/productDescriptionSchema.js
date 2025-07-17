import * as yup from 'yup';

const productDescriptionSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(10, `${name} must be at least 10 characters long.`)
  .max(1500, `${name} must be at most 1500 characters long.`);

export default productDescriptionSchema;
