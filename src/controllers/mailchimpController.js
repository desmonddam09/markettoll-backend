import axios from 'axios';
import crypto from 'crypto';

const apiKey = process.env.MAILCHIMP_API_KEY;
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

const url = `https://${serverPrefix}.api.mailchimp.com/3.0`;

function getAuthHeader() {
  return {
    auth: {
      username: 'anystring',
      password: apiKey,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

function hashEmail(email) {
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}

function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

export const signUpTrigger = async (req, res) => {
  const { email, name, tags } = req.body;
  const { firstName, lastName } = splitFullName(name);

  const baseUrl = `${url}/lists/${audienceId}/members`;
  const data = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: firstName,
      LNAME: lastName,
    },
    tags: tags,
  };

  try {
    const result = await axios.post(baseUrl, data, getAuthHeader());
    res.status(result.status).json({ success: true, result: result.data });
  } catch (err) {
    if (err.response?.status === 400 && err.response.data.title === 'Member Exists') {
      try {
        const result = await updateUser(email, firstName, lastName, tags);
        res.status(200).json({ success: true, result });
      } catch (updateErr) {
        console.error(updateErr.response?.data || updateErr.message);
        res.status(500).json({ success: false, result: updateErr.response });
      }
    } else {
      console.error(err.response?.data || err.message);
      res.status(500).json({ success: false, result: err.response });
    }
  }
};

export const mainTrigger = async (req, res) => {
  const { email, event, fullName, productName, orderId, subscribe_type } = req.body;

  if (!email || !event) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const { firstName, lastName } = splitFullName(fullName || '');

  const mergeFields = {};
  if (productName) mergeFields.PRODUCT = productName;
  if (orderId) mergeFields.ORDERID = orderId;
  if (subscribe_type) mergeFields.SUBSCRITION = subscribe_type;

  try {
    await updateUser(email, firstName, lastName, [], mergeFields);
    const result = await tagUser(email, event);

    res.status(result.status).json({
      status: result.status,
      statusText: result.statusText,
      data: result.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, error: err });
  }
};

export const tagUser = async (email, event) => {
  const baseUrl = `${url}/lists/${audienceId}/members/${hashEmail(email)}/tags`;

  const data = {
    tags: [{ name: event, status: 'active' }],
  };

  const result = await axios.post(baseUrl, data, getAuthHeader());
  return result;
};

export const updateUser = async (email, firstName, lastName, tags = [], mergeFields = {}) => {
  const data = {
    merge_fields: {
      ...(firstName && { FNAME: firstName }),
      ...(lastName && { LNAME: lastName }),
      ...mergeFields,
    },
    ...(tags.length > 0 && { tags }),
  };

  const result = await axios.patch(
    `${url}/lists/${audienceId}/members/${hashEmail(email)}`,
    data,
    getAuthHeader()
  );

  return result.data;
};