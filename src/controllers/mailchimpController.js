import axios from 'axios';
import crypto from 'crypto';
const apiKey = process.env.MAILCHIMP_API_KEY;
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

function getAuthHeader() {
  return {
    auth: {
      username: 'anystring',
      password: apiKey,
    },
  };
}

// Helper to hash email as required by Meta CAPI
function hashEmail(email) {
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}

function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

const url = `https://${serverPrefix}.api.mailchimp.com/3.0`;

export const signUpTrigger = async (req, res) => {
    const {email, name, tags} = req.body;
    console.log("signup_trigger", req.body);
    const { firstName, lastName } = splitFullName(name);
    console.log(firstName); // "Jane"
    console.log(lastName); 
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
        const newUser = await axios.post(baseUrl, data, getAuthHeader());
        console.log("newUser");
        res.status(200).json({success: true, data: newUser.data});
    } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.title === 'Member Exists') {
            const result = await updateUser(email, firstName, lastName, tags);
            res.status(200).json({ success: true, result});
        } else{
            res.status(500).json({success: false, error: err.data});
        }
    }
  
};

export const mainTrigger = async (req, res) => {
  console.log("trigger-event", req.body);
  const { email, event, fullName, productName, orderId, subscribe_type} = req.body;
  
  if(!email || !event) {
    return res.status(400).json({ success: false, error: 'Missing required fields'});
  }
  const { firstName, lastName } = splitFullName(fullName || '');
  
  const mergeFields = {};
  if(firstName) mergeFields.FNAME = firstName;
  if(lastName) mergeFields.LNAME = lastName;
  if(productName) mergeFields.PRODUCT = productName;
  if(orderId) mergeFields.ORDERID = orderId;
  if(subscribe_type) mergeFields.SUBSCRITION = subscribe_type;

  try {
    // Update user with name fields (creates user if not exists)
    await updateUser(email, firstName, lastName, [], mergeFields);
    // Tag the user with the event (e.g., 'card_linked')
    const result = await tagUser(email, event);
    console.log("ok");
    res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    console.log(err.data);
    res.status(500).json({ success: false, error: err.data });
  }
};

export const tagUser = async (email, event) => {
  const baseUrl = `${url}/lists/${audienceId}/members/${hashEmail(email)}/tags`;
  
  const data = {
    tags: [{ name: event, status: 'active' }],
  };
  try {
    const result = await axios.post(baseUrl, data, getAuthHeader());
    return result;
  } catch (error) {
    return error;
  }
}

export const updateUser = async (email, firstName, lastName, tags = [], mergeFields = {}) => {
    const data = {
        merge_fields: {
        ...(firstName && { FNAME: firstName }),
        ...(lastName && { LNAME: lastName }),
        ...mergeFields,
        },
        tags,
    };
    const res = await axios.patch(
        `${url}/lists/${audienceId}/members/${hashEmail(email)}`,
         data, 
         getAuthHeader());
    return res.data;
}

