import * as yup from 'yup';

const subcategoryNamesSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} are required.`, val => val.length !== 0)
  .min(1, `Minimum one ${name} are required.`)
  .max(9, `Maximum 9 ${name} are allowed.`)
  .of(
    yup.string()
      .required(`${name} is required.`)
      .typeError(`${name} must be a string.`)
  );

export default subcategoryNamesSchema;
