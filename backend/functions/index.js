import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import { securityHeaders } from './middleware/securityHeaders.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import createStripeRouter from './routes/stripe.js';
import ordersRoutes from './routes/orders.js';
import apliiqWebhooksRoutes from './routes/apliiq-webhooks.js';
import {
  getSecretValue,
  firebasePrivateKey,
  stripeSecretKey,
  stripeWebhookSecret,
  apliiqAppKey,
  apliiqSharedSecret,
  resendApiKey,
} from './config/secrets.js';

const frontendUrl = defineString('FRONTEND_URL', { default: 'https://9thform.com' });
const assetBaseUrl = defineString('ASSET_BASE_URL', { default: 'https://9thform.com' });

const app = express();
let stripeRouter = null;

app.use(securityHeaders);
app.use(cors({ origin: true, credentials: true }));
app.use('/stripe/webhook', (req, res, next) => {
  // Firebase Functions v2 automatically provides req.rawBody as a Buffer.
  // Only fall back to express.raw() for local dev where rawBody isn't pre-set.
  if (req.rawBody) {
    return next();
  }
  express.raw({ type: 'application/json' })(req, res, (err) => {
    if (err) return next(err);
    req.rawBody = req.body;
    next();
  });
});
app.use('/webhooks/apliiq', (req, res, next) => {
  // Firebase Functions v2 automatically provides req.rawBody as a Buffer.
  if (req.rawBody) {
    return next();
  }
  express.raw({ type: 'application/json' })(req, res, (err) => {
    if (err) return next(err);
    req.rawBody = req.body;
    next();
  });
});
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(standardRateLimiter);

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/stripe', (req, res, next) => {
  // Lazy initialize stripe router on first request (runtime, not deployment time)
  if (!stripeRouter) {
    stripeRouter = createStripeRouter({
      stripeSecretKey: getSecretValue(stripeSecretKey, 'STRIPE_SECRET_KEY'),
      stripeWebhookSecret: getSecretValue(stripeWebhookSecret, 'STRIPE_WEBHOOK_SECRET'),
      frontendUrl: frontendUrl.value(),
      assetBaseUrl: assetBaseUrl.value(),
    });
  }
  stripeRouter(req, res, next);
});
app.use('/orders', ordersRoutes);
app.use('/webhooks/apliiq', apliiqWebhooksRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Firebase Backend API' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export as Firebase Function
export const api = onRequest(
  {
    secrets: [firebasePrivateKey, stripeSecretKey, stripeWebhookSecret, apliiqAppKey, apliiqSharedSecret, resendApiKey],
    region: 'us-central1',
  },
  app
);