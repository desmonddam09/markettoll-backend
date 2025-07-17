import * as yup from 'yup';

const urlSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .matches(
    /^(https?:\/\/)[a-zA-Z0-9-]{4,}\.[a-zA-Z]{2,}$/,
    `${name} is invalid.`
  );

export default urlSchema;
