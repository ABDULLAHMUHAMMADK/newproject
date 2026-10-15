// src/controllers/adminController.js
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import { MINIMUM_INITIAL_DEPOSIT } from '../config/constants.js';
import { sendEmail } from '../services/emailService.js';
import { depositApprovedTemplate } from '../utils/emailTemplates.js';

// @desc    Get system-wide financial overview & metrics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const wallets = await Wallet.find({});

    const totalLiquidity = wallets.reduce((acc, w) => acc + w.mainBalance, 0);
    const totalProfitBalances = wallets.reduce((acc, w) => acc + w.profitBalance, 0);
    const totalReferralBalances = wallets.reduce((acc, w) => acc + w.referralBalance, 0);

    const pendingDepositsCount = await Transaction.countDocuments({ type: 'DEPOSIT', status: 'PENDING' });
    const pendingWithdrawalsCount = await Transaction.countDocuments({ type: 'WITHDRAWAL_REQUEST', status: 'PENDING' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalLiquidity,
        totalProfitBalances,
        totalReferralBalances,
        pendingDepositsCount,
        pendingWithdrawalsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all pending manual deposits
// @route   GET /api/admin/deposits/pending
// @access  Private/Admin
export const getPendingDeposits = async (req, res, next) => {
  try {
    const pendingDeposits = await Transaction.find({ type: 'DEPOSIT', status: 'PENDING' })
      .populate('user', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: pendingDeposits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a manual deposit request
// @route   PUT /api/admin/deposits/:id/action
// @access  Private/Admin
export const processDepositAction = async (req, res, next) => {
  try {
    const { action } = req.body; // 'APPROVE' or 'REJECT'
    const transactionId = req.params.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: "Action must be 'APPROVE' or 'REJECT'" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'DEPOSIT') {
      return res.status(404).json({ success: false, error: 'Pending deposit transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Transaction already ${transaction.status.toLowerCase()}` });
    }

    if (action === 'REJECT') {
      transaction.status = 'REJECTED';
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Manual deposit request rejected',
        data: transaction,
      });
    }

    // Action === 'APPROVE'
    transaction.status = 'COMPLETED';
    await transaction.save();

    const wallet = await Wallet.findOne({ user: transaction.user });
    const user = await User.findById(transaction.user);

    const previousBalance = wallet.mainBalance;
    wallet.mainBalance += transaction.amount;
    await wallet.save();

    // Record first deposit timestamp for 24h grace window & referral qualification
    if (previousBalance < MINIMUM_INITIAL_DEPOSIT && wallet.mainBalance >= MINIMUM_INITIAL_DEPOSIT) {
      if (!user.firstDepositAt) {
        user.firstDepositAt = new Date();
        await user.save();
      }
    }

    // Send confirmation email
    sendEmail({
      to: user.email,
      subject: 'Deposit Approved - TradeYield',
      html: depositApprovedTemplate(user.name, transaction.amount),
    }).catch((err) => console.error('Admin deposit approval email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Deposit approved and wallet credited successfully',
      data: {
        transaction,
        updatedMainBalance: wallet.mainBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all pending withdrawal cashout requests
// @route   GET /api/admin/withdrawals/pending
// @access  Private/Admin
export const getPendingWithdrawals = async (req, res, next) => {
  try {
    const pendingWithdrawals = await Transaction.find({ type: 'WITHDRAWAL_REQUEST', status: 'PENDING' })
      .populate('user', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: pendingWithdrawals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process/Complete or Reject a withdrawal payout request
// @route   PUT /api/admin/withdrawals/:id/action
// @access  Private/Admin
export const processWithdrawalAction = async (req, res, next) => {
  try {
    const { action, payoutTxHash } = req.body; // 'APPROVE' or 'REJECT'
    const transactionId = req.params.id;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, error: "Action must be 'APPROVE' or 'REJECT'" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
      return res.status(404).json({ success: false, error: 'Pending withdrawal transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: `Transaction already ${transaction.status.toLowerCase()}` });
    }

    if (action === 'REJECT') {
      // Refund requested funds back to user's profit balance
      const wallet = await Wallet.findOne({ user: transaction.user });
      if (wallet) {
        wallet.profitBalance += transaction.amount;
        await wallet.save();
      }

      transaction.status = 'REJECTED';
      await transaction.save();

      return res.status(200).json({
        success: true,
        message: 'Withdrawal rejected and funds refunded to user profit balance',
        data: transaction,
      });
    }

    // Action === 'APPROVE'
    transaction.status = 'COMPLETED';
    if (payoutTxHash) {
      transaction.txHash = payoutTxHash;
    }
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal payout marked as completed',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};