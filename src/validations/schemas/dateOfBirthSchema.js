import * as yup from 'yup';

const dateOfBirthSchema = (name) => yup.object().shape({
  day: yup
    .number()
    .required('Day is required.')
    .typeError('Day must be a number.')
    .min(1, 'Day must be at least 1.')
    .max(31, 'Day must be at most 31.'),

  month: yup
    .number()
    .required('Month is required.')
    .typeError('Month must be a number.')
    .min(1, 'Month must be at least 1.')
    .max(12, 'Month must be at most 12.'),

  year: yup
    .number()
    .required('Year is required.')
    .typeError('Year must be a number.')
    .min(1900, 'Year must be at least 1900.')
    .max(new Date().getFullYear(), 'Year cannot be in the future.'),
});

export default dateOfBirthSchema;
