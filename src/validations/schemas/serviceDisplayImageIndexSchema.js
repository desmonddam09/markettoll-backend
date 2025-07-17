import * as yup from 'yup';

const serviceDisplayImageIndexSchema = (name) => yup.object().shape({
  displayImageIndex: yup
    .number()
    .required(`${name} is required.`)
    .typeError(`${name} must be a number.`)
    .integer(`${name} must be an integer.`)
    .min(0, `${name} must be greater than or equal to 0.`)
    .test(
      'is-less-than-images-length',
      `${name} must be an index of images.`,
      function (value) {
        const { images } = this.parent;
        return value < images.length;
      }
    ),
});


export default serviceDisplayImageIndexSchema;
