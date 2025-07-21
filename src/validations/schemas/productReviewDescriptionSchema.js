import * as yup from 'yup';

const productReviewDescriptionSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(4, `${name} must be at least 4 characters long.`)
  .max(100, `${name} must be at most 100 characters long.`);

export default productReviewDescriptionSchema;
