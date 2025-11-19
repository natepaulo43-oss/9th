import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { onRequest } from 'firebase-functions/v2/https';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import createStripeRouter from './routes/stripe.js';
import {
  getSecretValue,
  firebasePrivateKey,
  stripeSecretKey,
  stripeWebhookSecret,
} from './config/secrets.js';

const app = express();
let stripeRouter;

const getStripeRouter = () => {
  if (!stripeRouter) {
    stripeRouter = createStripeRouter({
      stripeSecretKey: getSecretValue(stripeSecretKey, 'STRIPE_SECRET_KEY'),
      stripeWebhookSecret: getSecretValue(stripeWebhookSecret, 'STRIPE_WEBHOOK_SECRET'),
      frontendUrl: process.env.FRONTEND_URL,
      assetBaseUrl: process.env.ASSET_BASE_URL,
    });
  }
  return stripeRouter;
};

app.use(cors({ origin: true, credentials: true }));
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/stripe', (req, res, next) => getStripeRouter()(req, res, next));

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
    secrets: [firebasePrivateKey, stripeSecretKey, stripeWebhookSecret],
    region: 'us-central1',
  },
  app
);