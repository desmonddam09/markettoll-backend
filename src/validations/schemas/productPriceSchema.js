import * as yup from 'yup';

const productPriceSchema = (name) => yup
  .number()
  .required(`${name} is required.`)
  .typeError(`${name} must be a number.`)
  .positive(`${name} must be a positive number.`)
  .test(
    'is-decimal',
    `${name} must have at most 2 decimal places.`,
    (value) => /^\d+(\.\d{1,2})?$/.test(value.toString())
  )
  .max(1000000, `Max ${name} '1 million' is allowed.`);

export default productPriceSchema;
