// src/config/constants.js

// Investment Thresholds
export const MINIMUM_INITIAL_DEPOSIT = 300; // $300 minimum threshold

// Withdrawal Rules
export const WITHDRAWAL_GRACE_PERIOD_HOURS = 24; // 24-hour grace period for initial withdrawal
export const WITHDRAWAL_LOCK_PROFIT_TARGET = 50;  // $50 profit required after grace period
export const WITHDRAWAL_FEE_PERCENTAGE = 0.20;    // 20% platform fee deduction

// Yield & Referral Rules
export const DAILY_YIELD_RATE = 0.01;              // 1% daily compounding yield
export const REFERRAL_DIRECT_BONUS_FLAT = 50.0;    // Solid $50 direct bonus to referrer upon 24h qualification
export const REFERRAL_DAILY_PASSIVE_USD = 0.20;    // $0.20 daily passive reward from active referred user node