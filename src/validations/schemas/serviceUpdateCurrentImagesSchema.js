import * as yup from 'yup';

const serviceUpdateCurrentImagesSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} are required.`, val => val.length !== 0)
  .min(1, `Minimum one ${name} is required.`)
  .max(10, `Maximum ten ${name} are allowed.`)
  .of(
    yup
      .string()
      .required(`${name}'s url is required.`)
      .typeError(`${name}'s url must be a string.`)
      .matches(
        new RegExp(`^https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/.*$`),
        `Invalid ${name} url`
      )
  );

export default serviceUpdateCurrentImagesSchema;
