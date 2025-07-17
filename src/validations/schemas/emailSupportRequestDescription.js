import * as yup from 'yup';

const emailSupportRequestDescription = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(10, `${name} must be at least 10 characters long.`)
  .max(100, `${name} must be at most 100 characters long.`);

export default emailSupportRequestDescription;
