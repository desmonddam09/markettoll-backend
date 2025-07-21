import * as yup from 'yup';

const yearSchema = (name) => {
  const now = new Date();

  return yup
    .number()
    .required(`${name} is required.`)
    .typeError(`${name} must be a number.`)
    .integer(`${name} must be an integer.`)
    .min(2000, `${name} must be at least 2000.`)
    .max(now.getFullYear(), `${name} must be at max ${now.getFullYear()}.`);
};

export default yearSchema;
