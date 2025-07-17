import * as yup from 'yup';

const serviceUpdateDisplayImageIndexSchema = (name) => yup.object().shape({
  displayImageIndex: yup
    .string()
    .required(`${name} is required.`)
    .test(
      'is-valid',
      `${name} must be an index of new images or a current image url.`,
      function (value) {
        const { newImages, currentImages } = this.parent;
        const numberPattern = /^\d+$/;
        const urlPattern = new RegExp(`^https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/.*$`);
        if (numberPattern.test(value)) {
          return parseInt(value, 10) < newImages.length;
        } else if (urlPattern.test(value)) {
          return currentImages.includes(value);
        }
        return false;
      }
    )
});

export default serviceUpdateDisplayImageIndexSchema;
