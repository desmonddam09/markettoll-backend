import express from 'express';
import { metaController } from   "../controllers/index.js";

const router = express.Router();
// stripe connected account setup
router.post('/track-event',
  metaController.trachController,
);

export default router;