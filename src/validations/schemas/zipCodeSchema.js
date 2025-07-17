import * as yup from 'yup';

const zipCodeSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .min(3, `${name} must be at least 3 characters long.`)
  .max(10, `${name} must be at most 10 characters long.`)
  .matches(/^[a-zA-Z0-9]+$/, `${name} must contain only alphanumeric characters.`);

export default zipCodeSchema;
