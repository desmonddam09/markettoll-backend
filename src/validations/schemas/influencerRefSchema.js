import * as yup from 'yup';

// Regex for a valid MongoDB ObjectId (24 hex characters)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const influencerRefSchema = yup
  .string()
  .optional()
  .test('is-objectid', 'influencerRef must be a valid ObjectId', function (value) {
    if (!value) return true; // allow undefined or null
    return objectIdRegex.test(value);
  });

export default influencerRefSchema;
