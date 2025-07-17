import * as yup from 'yup';

const iso3166_2 = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .matches(/^[A-Z]{2}$/, `${name} must be a valid 2-letter state code.`);

export default iso3166_2;
