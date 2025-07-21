import * as yup from 'yup';

const categoryImageSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} are required.`, val => val.length !== 0)
  .min(1, `Minimum one ${name} are required.`)
  .max(1, `Maximum one ${name} are allowed.`)
  .of(
    yup.object().shape({
      mimetype: yup.string().required('Mime type is required.').oneOf(['image/png', 'image/jpg', 'image/jpeg'], 'Only png, jpg, jpeg images are allowed.'),
      size: yup.number().max(30 * 1024 * 1024, `${name} size must be less than 30 MB.`)
    })
  );

export default categoryImageSchema;
