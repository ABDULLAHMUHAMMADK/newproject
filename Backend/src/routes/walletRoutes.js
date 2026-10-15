// src/routes/walletRoutes.js
import express from 'express';
import { getMyWallet, getTopUpInfo, getWithdrawalInfo } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMyWallet);
router.get('/topup-info', protect, getTopUpInfo);
router.get('/withdraw-info', protect, getWithdrawalInfo);

export default router;