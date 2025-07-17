import * as yup from 'yup';

const reportedUserType = (name) => yup
  .string()
  .required(`${name} is required.`)
  .typeError(`${name} must be a string.`)
  .oneOf(['chat', 'seller-profile'], `${name} must be either chat or seller-profile.`);

export default reportedUserType;
