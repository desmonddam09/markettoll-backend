import * as yup from 'yup';

const productFulfillmentMethodSchema = (name) => yup.object({
  selfPickup: yup
    .boolean()
    .required(`${name}'s self pickup is required.`)
    .typeError(`${name}'s self pickup must be a boolean.`),
  delivery: yup
    .boolean()
    .required(`${name}'s delivery is required.`)
    .typeError(`${name}'s delivery must be a boolean.`),
}).test(
  'at-least-one-true',
  `At least one of ${name}'s selfPickup or delivery must be true.`,
  (value) => value.selfPickup === true || value.delivery === true
);

export default productFulfillmentMethodSchema;
