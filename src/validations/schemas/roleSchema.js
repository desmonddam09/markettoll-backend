import * as yup from 'yup';

const roleSchema = yup
  .string()
  .notRequired()
  .nullable()
  .matches(/^[a-zA-Z]+$/, 'Role can only contain alphabetic characters.')
  .min(3, 'Role must be at least 3 characters long.')
  .max(20, 'Role must be at most 20 characters long.');

export default roleSchema;
