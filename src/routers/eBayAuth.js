import express from 'express';
import { ebayController } from '../controllers/index.js';
import validateJWTAndValidateUser from '../accessControls/validateJWTAndValidateUser.js';
const router = express.Router();

router.get('/connect', ebayController.connect);

router.get('/callback', ebayController.callback);

router.get('/products', validateJWTAndValidateUser, ebayController.getUserProducts);

export default router;
