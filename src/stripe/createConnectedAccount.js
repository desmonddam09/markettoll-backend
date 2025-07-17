import { stripe } from './index.js';

const createConnectedAccount = async (email, phone, ip, bankDetails, dateOfBirth, idNumber) => {
  const account = await stripe.accounts.create({
    type: 'custom',
    business_type: 'individual',
    country: 'US',
    email: email,
    capabilities: {
      // card_payments: { requested: true },
      transfers: { requested: true },
    },
    external_account: {
      object: 'bank_account',
      country: 'US',
      currency: 'usd',
      account_holder_name: bankDetails.accountHolderName,
      account_holder_type: 'individual',
      routing_number: bankDetails?.routingNumber,
      account_number: bankDetails?.accountNumber,
    },
    individual: {
      id_number: idNumber,
      first_name: bankDetails.accountHolderName?.split(' ')[0] || 'John',
      last_name: bankDetails.accountHolderName?.split(' ')[1] || 'Smith',
      email: email,
      phone: phone,
      ssn_last_4: idNumber.slice(-4),
      dob: {
        day: dateOfBirth?.day,
        month: dateOfBirth?.month,
        year: dateOfBirth?.year,
      },
    },
    business_profile: {
      mcc: '5734',
      url: 'https://www.markettoll.com',
    },
    settings: {
      payments: {
        statement_descriptor: 'MarketToll LLC',
      },
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: ip || '104.223.93.238',
    },
  });

  return account;
};

export default createConnectedAccount;
