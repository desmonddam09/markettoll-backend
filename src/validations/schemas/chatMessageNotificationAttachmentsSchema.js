import * as yup from 'yup';

const chatMessageNotificationAttachmentsSchema = (name) => yup
  .array()
  .required(`${name} are required.`)
  .typeError(`${name} must be an array.`)
  .of(
    yup.object().shape({
      url: yup.string().required('Image url is required.'),
      type: yup.string().required('Type is required.'),
    })
  );

export default chatMessageNotificationAttachmentsSchema;
