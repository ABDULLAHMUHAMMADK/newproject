// Backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

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

// Connect to MongoDB Atlas
connectDB();

const app = express();

// 1. Manual Failsafe CORS Header Injection
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow production frontend, local dev, and Vercel preview domains
  if (!origin || origin.includes('newproject-7gyb') || origin.includes('localhost') || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://newproject-7gyb.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Return 200 immediately for preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// 2. Enable Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// 3. Express Body Parser
app.use(express.json({ limit: '10kb' }));

// 4. Custom NoSQL Injection Sanitizer
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  }
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  }
  next();
});

// 5. Prevent HTTP Parameter Pollution
app.use(hpp());

// 6. Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many auth attempts. Try again in 15 mins.' },
});

app.use('/api', generalLimiter);

// 7. Mount API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send({ status: 'API is running securely...' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Initialize Daily Yield Cron Scheduler
initYieldCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;