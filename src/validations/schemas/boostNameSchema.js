import * as yup from 'yup';

const boostNameSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .oneOf(['Quick Start', 'Extended Exposure', 'Maximum Impact'], `${name} must be one of 'Quick Start', 'Extended Exposure', or 'Maximum Impact'.`);

export default boostNameSchema;
