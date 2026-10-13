// src/config/constants.js

// Investment Thresholds
export const MINIMUM_INITIAL_DEPOSIT = 300; // $300 minimum threshold

// Withdrawal Rules
export const WITHDRAWAL_GRACE_PERIOD_HOURS = 24; // 24-hour grace period for full withdrawal
export const WITHDRAWAL_LOCK_PROFIT_TARGET = 50;  // $50 profit required after 24 hrs
export const WITHDRAWAL_FEE_PERCENTAGE = 0.20;    // 20% flat deduction fee

// Yield & Referral Rules
export const DAILY_YIELD_RATE = 0.01;           // 1% daily yield
export const REFERRAL_DIRECT_PERCENTAGE = 0.50; // 50% referral bonus on daily profit rate
export const REFERRAL_DAILY_PASSIVE_USD = 0.20; // $0.20 daily passive yield from active referred user