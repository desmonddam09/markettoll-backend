import * as yup from 'yup';

const phoneNumberSchema = (name) => yup.object().shape({
  code: yup
    .string()
    .required(`${name} code is required.`)
    .typeError(`${name} code must be a string.`)
    .min(1, `${name} code must be at least 1 characters long.`)
    .max(4, `${name} code must be at most 4 characters long.`)
    .matches(/^\d+$/, `${name} code must contain only digits 0-9.`),
  value: yup
    .string()
    .required(`${name} value is required.`)
    .typeError(`${name} value must be a string.`)
    .min(9, `${name} value must be at least 9 characters long.`)
    .max(11, `${name} value must be at most 11 characters long.`)
    .matches(/^\d+$/, `${name} value must contain only digits 0-9.`),
});

export default phoneNumberSchema;
