import * as yup from 'yup';

const serviceUpdateImageLengthSchema = (name) => yup.object().shape({
  currentImagesLength: yup
    .number()
    .required(`${name}'s current images length is required.`)
    .typeError(`${name}'s current images length must be a number.`)
    .integer(`${name}'s current images length must be an integer.`)
    .min(0, `${name}'s current images length must be greater than or equal to zero.`),
  newImagesLength: yup
    .number()
    .required(`${name}'s new images length is required.`)
    .typeError(`${name}'s new images length must be a number.`)
    .integer(`${name}'s new images length must be an integer.`)
    .min(0, `${name}'s new images length must be greater than or equal to zero.`),
}).test(
  'combined-length',
  `${name}'s current and new length must be between 3 and 10.`,
  function (value) {
    const { currentImagesLength, newImagesLength } = value;
    const combinedLength = currentImagesLength + newImagesLength;
    return combinedLength >= 3 && combinedLength <= 10;
  }
);

export default serviceUpdateImageLengthSchema;
