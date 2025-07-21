import * as yup from 'yup';

const platformSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .oneOf(['ios', 'android', 'web'], `${name} must be one of ios, android, web.`);

export default platformSchema;
