import * as yup from 'yup';

const booleanSchema = (name) => yup
  .boolean()
  .required(`${name} is required.`)
  .typeError(`${name} must be a boolean.`);

export default booleanSchema;
