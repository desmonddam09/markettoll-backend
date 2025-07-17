// import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import { router } from './src/routers/index.js';
import { defaultError } from './src/errors/index.js';
import { nextError } from './src/utils/index.js';
import { restoreTransientOrders, renewSubscriptionFreePlan, resetExpiredProductBoosts, resetExpiredServiceBoosts, sendNotificationOfSubscriptionExpiry, sendNotificationOfBoostedProductExpiry, sendNotificationOfBoostedServiceExpiry, addAdminStripeProfits, sendScheduleNotifications } from './src/cron/index.js';
import { printTime } from './src/helpers/index.js';
import { webhookAccount, webhookConnectedAccounts } from './src/stripe/index.js';
import { webhook as appleWebhook } from './src/inAppPurchases/apple/index.js';
import { webhook as googleWebhook } from './src/inAppPurchases/google/index.js';
import './src/cron/cron.js'
//constants
const app = express();
const upload = multer();

//stripe webhooks
app.post(
  '/stripe-webhook-account',
  express.raw({ type: 'application/json' }),
  webhookAccount
);
app.post(
  '/stripe-webhook-connected-accounts',
  express.raw({ type: 'application/json' }),
  webhookConnectedAccounts
);

//middlewares
app.use(cors());
app.use(upload.any());
app.use(express.json());
app.use((req, res, next) => {
  if (req?.body?.email) {
    req.body.email = req.body.email.toLowerCase();
  }
  next();
});
app.use((req, res, next) => {
  printTime();
  console.log(req.headers.authorization);
  console.log(req.method, req.url);
  // console.log('Body:', req.body);
  // console.log('Files:', req.files);
  next();
});

//apple webhook
app.post(
  '/apple-webhook',
  appleWebhook
);

//google webhook
app.post(
  '/google-webhook',
  googleWebhook
);

//default path
app.get('/', (req, res) => {
  res
    .status(200)
    .json({ success: true, message: 'Welcome to my server.', data: null });
});

//router
app.use('/api/v1', router);

//route not found
app.use((req, res, next) => {
  return nextError(next, 404, `Route not found - ${req.method} ${req.originalUrl}`);
});

//error
app.use(defaultError);

//database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then((res) => {
    app.listen(process.env.PORT, () => {
      console.log(`app is listening on port: ${process.env.PORT}`);
      restoreTransientOrders();
      renewSubscriptionFreePlan();
      resetExpiredProductBoosts();
      resetExpiredServiceBoosts();
      sendNotificationOfSubscriptionExpiry();
      sendNotificationOfBoostedProductExpiry();
      sendNotificationOfBoostedServiceExpiry();
      addAdminStripeProfits();
      sendScheduleNotifications();
    });
  })
  .catch((err) => console.log(err));
