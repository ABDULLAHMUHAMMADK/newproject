// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import depositRoutes from './src/routes/depositRoutes.js';
import webhookRoutes from './src/routes/webhookRoutes.js';
import withdrawalRoutes from './src/routes/withdrawalRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import referralRoutes from './src/routes/referralRoutes.js';

import errorHandler from './src/middleware/errorHandler.js';
import { initYieldCron } from './src/jobs/yieldCron.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send({ status: 'API is running successfully...' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Initialize Daily Yield Cron Scheduler
initYieldCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});