import express from 'express';
import { ebayController } from '../controllers/index.js';

const router = express.Router();

router.get('/connect', ebayController.connect);

router.get('/callback', ebayController.callback);

export default router;
