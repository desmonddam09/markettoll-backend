import * as yup from 'yup';

const pageSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .integer(`${name} must be an integer.`)
  .min(1, `${name} must be greater than or equal to 1.`);

export default pageSchema;
