import express from 'express';
import { validateJWTAndValidateUser, validateUserStripeSetup, validateUserVerified } from '../accessControls/index.js';
import { stripeValidation } from '../validations/index.js';
import { stripeController } from '../controllers/index.js';
import { metaController } from   "../controllers/index.js";

const router = express.Router();
// stripe connected account setup
router.post('/track-event',
  metaController.trachController,
);

export default router;