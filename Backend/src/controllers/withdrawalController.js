// src/controllers/withdrawalController.js
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { sendEmail } from '../services/emailService.js';
import { withdrawalRequestedTemplate } from '../utils/emailTemplates.js';
import {
  WITHDRAWAL_GRACE_PERIOD_HOURS,
  WITHDRAWAL_LOCK_PROFIT_TARGET,
  WITHDRAWAL_FEE_PERCENTAGE,
} from '../config/constants.js';

// @desc    Submit Cashout/Withdrawal Request
// @route   POST /api/withdrawals/request
// @access  Private
export const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, binancePayId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Please specify a valid withdrawal amount' });
    }

    if (!binancePayId) {
      return res.status(400).json({ success: false, error: 'Please provide your Binance Pay ID for receiving payout' });
    }

    const user = await User.findById(req.user._id);
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet record not found' });
    }

    // Evaluate single 24-hour grace window status
    let isInGracePeriod = false;
    if (user.firstDepositAt && !user.hasUsedGracePeriod) {
      const hoursElapsed = (new Date() - new Date(user.firstDepositAt)) / (1000 * 60 * 60);
      if (hoursElapsed <= WITHDRAWAL_GRACE_PERIOD_HOURS) {
        isInGracePeriod = true;
      }
    }

    // Evaluate profit lock unlock condition
    const profitTargetMet = wallet.unwithdrawnProfitCounter >= WITHDRAWAL_LOCK_PROFIT_TARGET;
    const canWithdraw = isInGracePeriod || profitTargetMet;

    if (!canWithdraw) {
      return res.status(400).json({
        success: false,
        error: `Withdrawal locked. Your 24-hour initial grace period has expired and you must accumulate at least $${WITHDRAWAL_LOCK_PROFIT_TARGET} USDT in unwithdrawn profit to unlock cashouts. Current accumulated profit: $${wallet.unwithdrawnProfitCounter.toFixed(2)} USDT.`,
      });
    }

    // Determine available total balance (Profit + Referral + Main Capital)
    const totalAvailable = wallet.profitBalance + wallet.referralBalance + wallet.mainBalance;

    if (amount > totalAvailable) {
      return res.status(400).json({
        success: false,
        error: `Insufficient total balance. Available balance: $${totalAvailable.toFixed(2)} USDT.`,
      });
    }

    // Calculate 20% platform fee
    const feeDeducted = amount * WITHDRAWAL_FEE_PERCENTAGE;
    const netAmount = amount - feeDeducted;

    // Save destination Binance Pay ID to wallet profile for quick future cashouts
    wallet.binancePayId = binancePayId;

    // Deduct requested amount from profit/referral/main balance logically
    let remainingToDeduct = amount;

    if (wallet.profitBalance >= remainingToDeduct) {
      wallet.profitBalance -= remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      remainingToDeduct -= wallet.profitBalance;
      wallet.profitBalance = 0;
    }

    if (remainingToDeduct > 0 && wallet.referralBalance >= remainingToDeduct) {
      wallet.referralBalance -= remainingToDeduct;
      remainingToDeduct = 0;
    } else if (remainingToDeduct > 0) {
      remainingToDeduct -= wallet.referralBalance;
      wallet.referralBalance = 0;
    }

    if (remainingToDeduct > 0) {
      wallet.mainBalance -= remainingToDeduct;
    }

    // Reset unwithdrawn profit counter back to 0 upon withdrawal
    wallet.unwithdrawnProfitCounter = 0;

    // Mark single grace period as used
    if (isInGracePeriod) {
      user.hasUsedGracePeriod = true;
      await user.save();
    }

    await wallet.save();

    // Log pending withdrawal in ledger
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'WITHDRAWAL_REQUEST',
      amount,
      feeDeducted,
      netAmount,
      status: 'PENDING',
      description: `Withdrawal request to Binance Pay ID: ${binancePayId}`,
    });

    // Send transaction email confirmation
    sendEmail({
      to: user.email,
      subject: 'Withdrawal Request Received - TradeYield',
      html: withdrawalRequestedTemplate(user.name, amount, feeDeducted, netAmount, binancePayId),
    }).catch((err) => console.error('Withdrawal request email error:', err.message));

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction,
        updatedWallet: {
          mainBalance: wallet.mainBalance,
          profitBalance: wallet.profitBalance,
          referralBalance: wallet.referralBalance,
          unwithdrawnProfitCounter: wallet.unwithdrawnProfitCounter,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};