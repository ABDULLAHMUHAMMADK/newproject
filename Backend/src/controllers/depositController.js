// src/controllers/depositController.js
import crypto from 'crypto';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { createBinanceOrder } from '../services/binancePayService.js';
import { MINIMUM_INITIAL_DEPOSIT } from '../config/constants.js';

// @desc    Initiate Binance Pay Deposit Order
// @route   POST /api/deposits/binance-order
// @access  Private
export const initiateBinanceDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ user: req.user._id });

    const currentBalance = wallet ? wallet.mainBalance : 0;
    let minRequired = MINIMUM_INITIAL_DEPOSIT;

    if (currentBalance > 0 && currentBalance < MINIMUM_INITIAL_DEPOSIT) {
      minRequired = MINIMUM_INITIAL_DEPOSIT - currentBalance;
    } else if (currentBalance >= MINIMUM_INITIAL_DEPOSIT) {
      minRequired = 1;
    }

    if (!amount || amount < minRequired) {
      return res.status(400).json({
        success: false,
        error: `Deposit amount below required threshold. Minimum deposit allowed for your account is $${minRequired} USDT.`,
      });
    }

    const merchantTradeNo = `TY_DEP_${Date.now()}_${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Create pending transaction entry
    await Transaction.create({
      user: req.user._id,
      type: 'DEPOSIT',
      amount,
      status: 'PENDING',
      merchantTradeNo,
      description: 'Binance Pay automated deposit checkout initiated',
    });

    // Call Binance Pay API
    const binanceResponse = await createBinanceOrder({
      merchantTradeNo,
      totalFee: amount,
      currency: 'USDT',
      productDetail: `TradeYield Capital Deposit - ${req.user.email}`,
    });

    if (binanceResponse.status === 'SUCCESS') {
      return res.status(200).json({
        success: true,
        message: 'Binance Pay checkout order created successfully',
        data: {
          merchantTradeNo,
          amount,
          checkoutUrl: binanceResponse.data.checkoutUrl,
          qrcodeLink: binanceResponse.data.qrcodeLink,
          universalUrl: binanceResponse.data.universalUrl,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: binanceResponse.errorMessage || 'Failed to generate Binance Pay invoice',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Manual Deposit Request (Admin Verification Fallback)
// @route   POST /api/deposits/manual
// @access  Private
export const submitManualDeposit = async (req, res, next) => {
  try {
    const { amount, txHash, description } = req.body;

    if (!amount || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Please provide deposit amount and transaction hash (TxID)',
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    const currentBalance = wallet ? wallet.mainBalance : 0;
    let minRequired = MINIMUM_INITIAL_DEPOSIT;

    if (currentBalance > 0 && currentBalance < MINIMUM_INITIAL_DEPOSIT) {
      minRequired = MINIMUM_INITIAL_DEPOSIT - currentBalance;
    } else if (currentBalance >= MINIMUM_INITIAL_DEPOSIT) {
      minRequired = 1;
    }

    if (amount < minRequired) {
      return res.status(400).json({
        success: false,
        error: `Amount below required threshold. Minimum deposit required: $${minRequired} USDT.`,
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'DEPOSIT',
      amount,
      txHash,
      status: 'PENDING',
      description: description || 'Manual deposit transaction hash submitted for verification',
    });

    res.status(201).json({
      success: true,
      message: 'Manual deposit proof submitted. Awaiting admin review.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};