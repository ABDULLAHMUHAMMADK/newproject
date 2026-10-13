// src/models/Wallet.js
import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    mainBalance: {
      type: Number,
      default: 0, // Total active principal deposit balance
    },
    profitBalance: {
      type: Number,
      default: 0, // Accrued daily compounding returns
    },
    unwithdrawnProfitCounter: {
      type: Number,
      default: 0, // Tracks profit accumulated toward the $50 withdrawal unlock requirement
    },
    referralBalance: {
      type: Number,
      default: 0, // Referral commission earnings
    },
    binancePayId: {
      type: String,
      default: '', // User's personal Binance Pay ID for receiving withdrawals
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;