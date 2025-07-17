import * as yup from 'yup';

const passwordSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .min(8, `${name} must be at least 8 characters long.`)
  .max(20, `${name} must be at most 20 characters long.`)
  // .matches(
  //   /^[a-zA-Z0-9!._-]+$/,
  //   `${name} can only contain letters, digits, and the characters !_.-`
  // )
  .matches(
    /[A-Z]/,
    `${name} must contain at least one uppercase letter.`
  )
  .matches(
    /[a-z]/,
    `${name} must contain at least one lowercase letter.`
  )
  .matches(/\d/, `${name} must contain at least one digit.`);

export default passwordSchema;
