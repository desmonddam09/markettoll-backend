import * as yup from 'yup';

const emailSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .email(`${name} is invalid.`);

export default emailSchema;
