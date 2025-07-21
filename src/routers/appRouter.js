import express from 'express';
import { appValidation } from '../validations/index.js';
import { appController } from '../controllers/index.js';

const router = express.Router();

//routes
router.post(
  '/populate',
  appValidation.populate,
  appController.populate,
);

router.get(
  '/logs',
  appController.getLogs,
);

export default router;
