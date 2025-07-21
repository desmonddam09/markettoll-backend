import { stripeConnectedAccountIssuesModel } from '../models/index.js';
import { throwError } from '../utils/index.js';
import { stripe } from './index.js';

const updateConnectedAccount = async (accountId, name, verificationDocument, bankDetails) => {
  let updateDoc = {};

  if (verificationDocument.front && verificationDocument.back) {
    const issue = await stripeConnectedAccountIssuesModel.findOne({ 'event.data.object.id': accountId });
    if (!issue) {
      throwError(404, "Stripe issue document not found.");
    }

    const verificationIssueExists = issue.event.data.object.requirements.currently_due.includes('individual.verification.document');

    if (!verificationIssueExists) {
      throwError(409, 'Identity already verified.');
    }

    const frontFile = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: verificationDocument.front.buffer,
        name: verificationDocument.front.originalname,
        type: verificationDocument.front.mimetype,
      },
    });

    const backFile = await stripe.files.create({
      purpose: 'identity_document',
      file: {
        data: verificationDocument.back.buffer,
        name: verificationDocument.back.originalname,
        type: verificationDocument.back.mimetype,
      },
    });

    updateDoc = {
      ...updateDoc,
      individual: {
        verification: {
          document: {
            front: frontFile.id,
            back: backFile.id
          }
        }
      }
    };
  }

  if (bankDetails.accountNumber && bankDetails.routingNumber) {
    updateDoc = {
      ...updateDoc,
      external_account: {
        object: 'bank_account',
        country: 'US',
        currency: 'usd',
        account_holder_name: name || 'John Smith',
        account_holder_type: 'individual',
        routing_number: bankDetails.routingNumber,
        account_number: bankDetails.accountNumber,
      }
    };
  }

  const account = await stripe.accounts.update(accountId, updateDoc);

  return account;
};

export default updateConnectedAccount;
