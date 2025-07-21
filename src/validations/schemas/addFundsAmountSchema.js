import * as yup from 'yup';

const addFundsAmountSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .positive(`${name} must be a positive number.`)
  .min(0.5, `${name} must be minimum 0.50 usd.`)
  .max(999999.99, `${name} must be max 999,999.99 usd`)
  .test(
    'is-decimal',
    `${name} must have at most 2 decimal places.`,
    (value) => /^\d+(\.\d{1,2})?$/.test(value.toString())
  );

export default addFundsAmountSchema;
