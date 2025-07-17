import * as yup from 'yup';

const payoutFundsAmountSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .positive(`${name} must be a positive number.`)
  .min(1, `${name} must be minimum 1.00 usd.`)
  .test(
    'is-decimal',
    `${name} must have at most 2 decimal places.`,
    (value) => /^\d+(\.\d{1,2})?$/.test(value.toString())
  );

export default payoutFundsAmountSchema;
