import * as yup from 'yup';

const subcategoryAndImagesLengthSchema = (name) => yup.object({
  imagesLength: yup
    .number()
    .integer('Images length must be an integer.')
    .required('Images length is required.'),
  subcategoryNamesLength: yup
    .number()
    .integer('Subcategory names length must be an integer.')
    .required('Subcategory names length is required.')
}).test(
  'numbers-match',
  `Images length must be equal to ${name}'s length.`,
  function (values) {
    const { imagesLength, subcategoryNamesLength } = values;
    return imagesLength === subcategoryNamesLength;
  }
);

export default subcategoryAndImagesLengthSchema;
