// src/controllers/walletController.js
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import {
  MINIMUM_INITIAL_DEPOSIT,
  WITHDRAWAL_GRACE_PERIOD_HOURS,
  WITHDRAWAL_LOCK_PROFIT_TARGET,
  WITHDRAWAL_FEE_PERCENTAGE,
} from '../config/constants.js';

// @desc    Get live user wallet details & audit stats
// @route   GET /api/wallet/me
// @access  Private
export const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate dynamic minimum top-up required for current user
// @route   GET /api/wallet/topup-info
// @access  Private
export const getTopUpInfo = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    const currentBalance = wallet ? wallet.mainBalance : 0;

    let minRequiredDeposit = MINIMUM_INITIAL_DEPOSIT;

    if (currentBalance > 0 && currentBalance < MINIMUM_INITIAL_DEPOSIT) {
      minRequiredDeposit = MINIMUM_INITIAL_DEPOSIT - currentBalance;
    } else if (currentBalance >= MINIMUM_INITIAL_DEPOSIT) {
      minRequiredDeposit = 1; // Standard minimum for accounts already meeting threshold
    }

    res.status(200).json({
      success: true,
      data: {
        currentMainBalance: currentBalance,
        minimumRequiredThreshold: MINIMUM_INITIAL_DEPOSIT,
        minRequiredDeposit,
        isThresholdMet: currentBalance >= MINIMUM_INITIAL_DEPOSIT,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get withdrawal eligibility status, grace period state, and fee breakdown
// @route   GET /api/wallet/withdraw-info
// @access  Private
export const getWithdrawalInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    // Check 24-hour grace period status
    let isInGracePeriod = false;
    let hoursRemainingInGrace = 0;

    if (user.firstDepositAt && !user.hasUsedGracePeriod) {
      const now = new Date();
      const firstDepositTime = new Date(user.firstDepositAt);
      const hoursElapsed = (now - firstDepositTime) / (1000 * 60 * 60);

      if (hoursElapsed <= WITHDRAWAL_GRACE_PERIOD_HOURS) {
        isInGracePeriod = true;
        hoursRemainingInGrace = (WITHDRAWAL_GRACE_PERIOD_HOURS - hoursElapsed).toFixed(2);
      }
    }

    // Withdrawal eligibility rule:
    // User can withdraw if:
    // 1. Currently inside their single 24-hour grace window
    // OR
    // 2. Unwithdrawn accumulated profit >= $50
    const profitTargetMet = wallet.unwithdrawnProfitCounter >= WITHDRAWAL_LOCK_PROFIT_TARGET;
    const canWithdraw = isInGracePeriod || profitTargetMet;

    res.status(200).json({
      success: true,
      data: {
        mainBalance: wallet.mainBalance,
        profitBalance: wallet.profitBalance,
        unwithdrawnProfitCounter: wallet.unwithdrawnProfitCounter,
        referralBalance: wallet.referralBalance,
        binancePayId: wallet.binancePayId,
        withdrawalRules: {
          hasUsedGracePeriod: user.hasUsedGracePeriod,
          isInGracePeriod,
          hoursRemainingInGrace,
          profitLockTarget: WITHDRAWAL_LOCK_PROFIT_TARGET,
          profitTargetMet,
          canWithdraw,
          platformFeePercentage: WITHDRAWAL_FEE_PERCENTAGE * 100, // 20%
        },
      },
    });
  } catch (error) {
    next(error);
  }
};