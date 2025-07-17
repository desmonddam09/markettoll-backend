import * as yup from 'yup';

const chatAttachmentsSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} are required.`, val => val.length !== 0)
  .min(1, `Minimum one ${name} are required.`)
  .max(100, `Maximum hundred ${name} are allowed.`)
  .of(
    yup.object().shape({
      mimetype: yup.string().required('Mime type is required.'),
      size: yup.number().max(30 * 1024 * 1024, `${name} size must be less than 30 MB.`)
    })
  );

export default chatAttachmentsSchema;
