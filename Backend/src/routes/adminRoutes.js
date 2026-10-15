// src/routes/adminRoutes.js
import express from 'express';
import {
  getAdminStats,
  getPendingDeposits,
  processDepositAction,
  getPendingWithdrawals,
  processWithdrawalAction,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect & admin middlewares to all routes in this router
router.use(protect, admin);

router.get('/stats', getAdminStats);
router.get('/deposits/pending', getPendingDeposits);
router.put('/deposits/:id/action', processDepositAction);
router.get('/withdrawals/pending', getPendingWithdrawals);
router.put('/withdrawals/:id/action', processWithdrawalAction);

export default router;