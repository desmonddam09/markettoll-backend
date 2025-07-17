import * as yup from 'yup';

const reportedUserReason = (name) => yup.object().shape({
  selectedReason: yup.string(),
  otherReason: yup.string(),
}).test(
  'only-one',
  `Only one of selected reason or other reason must be provided.`,
  function (value) {
    return (value.selectedReason && !value.otherReason) || (!value.selectedReason && value.otherReason);
  }
);

export default reportedUserReason;
