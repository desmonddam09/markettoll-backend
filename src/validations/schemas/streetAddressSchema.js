import * as yup from 'yup';

const streetAddressSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(4, `${name} must be at least 4 characters long.`)
  .max(80, `${name} must be at most 80 characters long.`);

export default streetAddressSchema;
