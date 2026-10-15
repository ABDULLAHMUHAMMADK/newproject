// src/jobs/yieldCron.js
import cron from 'node-cron';
import { processDailyYields } from '../services/yieldService.js';

export const initYieldCron = () => {
  // Runs every day at 00:00 (Midnight UTC)
  // Schedule syntax: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('Cron Triggered: Executing Daily Yield Calculation...');
    try {
      await processDailyYields();
    } catch (error) {
      console.error('Cron Execution Failed:', error.message);
    }
  });

  console.log('Daily Yield Cron Job Worker initialized (Runs daily at 00:00 UTC)');
};