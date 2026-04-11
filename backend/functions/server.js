import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import createStripeRouter from './routes/stripe.js';
import ordersRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 5000;

const stripeRouter = createStripeRouter({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  assetBaseUrl: process.env.ASSET_BASE_URL || 'http://localhost:3000',
});

app.use(cors({ origin: true, credentials: true }));
app.use('/stripe/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body; // Buffer from express.raw, needed for Stripe signature verification
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/stripe', stripeRouter);
app.use('/orders', ordersRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Firebase Backend API - Local Dev Server' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Orders API: http://localhost:${PORT}/orders`);
  console.log(`💳 Stripe API: http://localhost:${PORT}/stripe`);
  console.log(`\n✅ Ready to receive requests!`);
});
