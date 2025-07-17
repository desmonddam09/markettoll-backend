import * as yup from 'yup';
import mongoose from 'mongoose';

const idSchema = (name) => yup
  .string()
  .required(`${name} is required.`)
  .test('is-valid-objectId', `${name} is invalid.`, (value) =>
    mongoose.Types.ObjectId.isValid(value)
  );

export default idSchema;
