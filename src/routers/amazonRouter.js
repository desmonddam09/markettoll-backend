import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import EbayTokenModel from '../models/eBayTokenModel.js';
import { ebayController } from '../controllers/index.js';
import { amazonController } from '../controllers/index.js';

const router = express.Router();

router.get('/authorize', amazonController.redirectToAmazon);

router.get('/callback', amazonController.handleAmazonCallback);

export default router;
