import * as yup from 'yup';

const stringSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`);

export default stringSchema;
