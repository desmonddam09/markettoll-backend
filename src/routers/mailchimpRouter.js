import express from 'express';
import { validateJWTAndValidateUser } from '../accessControls/index.js';
import { mailchimpController } from '../controllers/index.js';

const router = express.Router();

// router.post('/subscribe-on-signup', validateJWTAndValidateUser, mailchimpController.signUpTrigger);
router.post('/subscribe-on-signup', mailchimpController.signUpTrigger);
router.post('/trigger-event', mailchimpController.mainTrigger);
export default router;