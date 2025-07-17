import * as yup from 'yup';

const apartmentSuiteSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(1, `${name} must be at least 1 characters long.`)
  .max(20, `${name} must be at most 20 characters long.`);

export default apartmentSuiteSchema;
