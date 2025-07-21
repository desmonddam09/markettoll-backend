import * as yup from 'yup';

const nameSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[^\s]/, `${name} cannot have leading spaces.`)
  .matches(/[^\s]$/, `${name} cannot have trailing spaces.`)
  .min(4, `${name} must be at least 4 characters long.`)
  .max(30, `${name} must be at most 30 characters long.`)
  .matches(
    /^[a-zA-Z0-9]+(?:\s[a-zA-Z0-9]+)*$/,
    `${name} can only contain alphabetic characters and digits and single spaces between words.`
  );

export default nameSchema;
