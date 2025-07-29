import express from 'express';
import appRouter from './appRouter.js';
import userRouter from './userRouter.js';
import stripeRouter from './stripeRouter.js';
import adminRouter from './adminRouter.js';
import referralLinkRouter from './referralLinkRouter.js';
import metaRouter from "./metaRouter.js";
import mailchimpRouter from "./mailchimpRouter.js";
import eBayRouter from "./eBayAuth.js";
import amazonRouter from "./amazonRouter.js";

const router = express.Router();

//routes
router.use('/app', appRouter);
router.use('/users', userRouter);
router.use('/influencer', referralLinkRouter);
router.use('/stripe', stripeRouter);
router.use('/admin', adminRouter);
router.use('/meta', metaRouter);
router.use('/mailchimp', mailchimpRouter);
router.use('/ebay', eBayRouter);
router.use('/amazon', amazonRouter);

export default router;
