import { stripe } from './index.js';
import { userModel, stripeConnectedAccountIssuesModel } from '../models/index.js';
import { throwError } from '../utils/index.js';

const accountUpdated = async (event) => {

   const { disabled_reason, currently_due, eventually_due } = event.data.object.requirements;

   console.log("event.data.object====", event.data.object);
   console.log("event.data.object.external_accounts+++++++++++++====", event.data.object.external_accounts);
   

  console.log("Currently Due =>", currently_due);
  console.log("Disabled Reason =>", disabled_reason);
  console.log("Eventually Due =>", eventually_due);

   if (disabled_reason === null) {
      const updatedUser = await userModel.findOneAndUpdate(
          { 'stripeConnectedAccount.id': event.data.object.id },
          {
            $set: {
              'stripeConnectedAccount.external_account.id': event.data.object.external_accounts.data[0].id,
              'stripeConnectedAccount.external_account.bankName': event.data.object.external_accounts.data[0].bank_name,
              'stripeConnectedAccount.external_account.last4': event.data.object.external_accounts.data[0].last4,
              'stripeConnectedAccount.external_account.routingNumber': event.data.object.external_accounts.data[0].routing_number,
            },
          },
          { new: true }
        );

    }

  const stripeConnectedAccountIssues = await stripeConnectedAccountIssuesModel.findOneAndUpdate(
    { 'event.data.object.id': event.data.object.id },
    { event: event },
    { upsert: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }
  if (!stripeConnectedAccountIssues) {
    throwError(404, 'Stripe connected account issues not found.');
  }
};

const externalAccountCreated = async (event) => {
  const updatedUser = await userModel.findOneAndUpdate(
    { 'stripeConnectedAccount.id': event.data.object.account },
    {
      $set: {
        'stripeConnectedAccount.external_account.id': event.data.object.id,
        'stripeConnectedAccount.external_account.bankName': event.data.object.bank_name,
        'stripeConnectedAccount.external_account.last4': event.data.object.last4,
        'stripeConnectedAccount.external_account.routingNumber': event.data.object.routing_number,
      },
    },
    { new: true }
  );

  const data = [{ ...event.data.object }];
  const stripeConnectedAccountIssues = await stripeConnectedAccountIssuesModel.findOneAndUpdate(
    { 'event.data.object.id': event.data.object.account },
    { 'event.data.object.external_accounts.data': data },
    { upsert: true }
  );

  if (!updatedUser) {
    throwError(404, 'User not found.');
  }
  if (!stripeConnectedAccountIssues) {
    throwError(404, 'Stripe connected account issues not found.');
  }
};

const accountApplicationDeauthorized = async (event) => {
  const account = event.account;
  const user = await userModel.findOneAndUpdate(
    {
      'stripeConnectedAccount.id': account
    },
    {
      $set: {
        'stripeConnectedAccount.id': null,
        'stripeConnectedAccount.external_account.id': null,
        'stripeConnectedAccount.external_account.bankName': '',
        'stripeConnectedAccount.external_account.last4': '',
        'stripeConnectedAccount.external_account.routingNumber': '',
      }
    },
    { new: true }
  );

  const acc = await stripeConnectedAccountIssuesModel.findOne({ 'event.data.object.id': account });

  if (!acc) {
    throwError(404, 'Connected account not found in issues model.');
  }

  await acc.deleteOne();

  if (!user) {
    throwError(404, 'User not found.');
  }
};

const webhookConnectedAccounts = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];

    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_CONNECTED_ACCOUNTS);

    if ((process.env.NODE_ENV === 'development' && !event.livemode) || (process.env.NODE_ENV === 'staging' && !event.livemode) || (process.env.NODE_ENV === 'production' && event.livemode)) {
      switch (event.type) {
        case 'account.updated':
      console.log(`${event.type} Event Recviced`);
          await accountUpdated(event);
          break;
        case 'account.external_account.created':
          await externalAccountCreated(event);
          break;
        case 'account.application.deauthorized':
          await accountApplicationDeauthorized(event);
          break;
        // default:
        // console.log(`Unhandled connected account event type ${event.type}`);
      }
    }
  } catch (err) {
    console.log('Stripe connected accounts webhook error', err);
  } finally {
    res.status(200).json({
      success: true,
      message: 'Stripe connected accounts webhook event received successfully.',
      data: null
    });
  }
};

export default webhookConnectedAccounts;
