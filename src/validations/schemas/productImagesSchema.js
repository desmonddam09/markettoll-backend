import * as yup from 'yup';

const productImagesSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} are required.`, val => val.length !== 0)
  .min(3, `Minimum three ${name} are required.`)
  .max(10, `Maximum ten ${name} are allowed.`)
  .of(
    yup.object().shape({
      mimetype: yup.string().required('Mime type is required.').oneOf(['image/png', 'image/jpg', 'image/jpeg'], 'Only png, jpg, jpeg images are allowed.'),
      size: yup.number().max(30 * 1024 * 1024, `${name} size must be less than 30 MB.`)
    })
  );

export default productImagesSchema;
