import * as yup from 'yup';

const productLocationSchema = (name = 'Location') => yup
  .object({
    type: yup
      .string()
      .required(`${name} type is required.`)
      .oneOf(['Point'], `${name} type must be 'Point'.`),
    coordinates: yup
      .array()
      .of(yup.number().typeError(`${name} coordinates must be numbers.`))
      .length(2, `${name} coordinates must contain exactly two numbers [longitude, latitude].`)
      .required(`${name} coordinates are required.`),
  })
  .nullable() // allow it to be optional
  .notRequired();

export default productLocationSchema;
