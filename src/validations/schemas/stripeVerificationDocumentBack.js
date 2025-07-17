import * as yup from 'yup';

const stripeVerificationDocumentBack = (name) => yup
  .array()
  .required(`${name} is required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} is required.`, val => val.length !== 0)
  .min(1, `Minimum one ${name} is required.`)
  .max(1, `Maximum one ${name} is allowed.`);

export default stripeVerificationDocumentBack;
