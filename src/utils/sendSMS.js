import twilio from 'twilio';

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const verifyPhoneNumber = async (phoneNumber, otp) => {
  const message = `Your MarketToll phone number verification code is ${otp}. Please enter this code to verify your phone number.`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+${phoneNumber.code}${phoneNumber.value}`
  });
};

export const updatePhoneNumber = async (phoneNumber, otp) => {
  const message = `Your MarketToll phone number update code is ${otp}. Please enter this code to update your phone number.`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+${phoneNumber.code}${phoneNumber.value}`
  });
};
