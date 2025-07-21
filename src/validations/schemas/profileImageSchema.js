import * as yup from 'yup';

const profileImageSchema = (name) => yup
  .array()
  .required(`${name} is required.`)
  .typeError(`${name} must be an array.`)
  .test('len', `${name} is required.`, val => val.length !== 0)
  .min(1, `Exactly one ${name} is required.`)
  .max(1, `Exactly one ${name} is required.`)
  .of(
    yup.object().shape({
      mimetype: yup.string().required('Mime type is required.').oneOf(['image/png', 'image/jpg', 'image/jpeg'], 'Only png, jpg, jpeg image is allowed.'),
      size: yup.number().max(30 * 1024 * 1024, `${name} size must be less than 30 MB.`)
    })
  );

export default profileImageSchema;
