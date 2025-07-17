import * as yup from 'yup';

const dateISOStringSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .test('is-iso-date', 'Date must be in ISO 8601 format', (value) => {
    return !isNaN(Date.parse(value)) && value === new Date(value).toISOString();
  });

export default dateISOStringSchema;
