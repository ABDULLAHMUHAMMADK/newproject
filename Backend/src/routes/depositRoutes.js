// src/routes/depositRoutes.js
import express from 'express';
import { initiateBinanceDeposit, submitManualDeposit } from '../controllers/depositController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/binance-order', protect, initiateBinanceDeposit);
router.post('/manual', protect, submitManualDeposit);

export default router;