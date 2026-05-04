import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { securityHeaders } from './middleware/securityHeaders.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { db } from './config/firebase.js';
import { sendDeliveryEmail, sendTrackingEmail } from './lib/email.js';

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

// Job: Poll Apliiq every 4 hours for tracking updates on submitted orders.
// When Apliiq adds a tracking number, we update Firestore and auto-send the tracking email.
export const apliiqPollJob = onSchedule(
  {
    schedule: '0 */4 * * *', // every 4 hours
    secrets: [apliiqAppKey, apliiqSharedSecret, resendApiKey],
    region: 'us-central1',
  },
  async () => {
    const { getApliiqOrderStatus, toNumericOrderId } = await import('./lib/apliiq.js');

    // Find all orders submitted to Apliiq that don't have a tracking number yet
    const snapshot = await db
      .collection('orders')
      .where('apliqStatus', 'in', ['submitted', 'submitted_to_supplier'])
      .get();

    console.log(`[ApliiqPollJob] Checking ${snapshot.docs.length} submitted order(s) for tracking updates`);

    for (const doc of snapshot.docs) {
      const order = doc.data();

      // Resolve the best ID to use for the Apliiq API lookup:
      // 1. Use stored apliiqOrderId if valid
      // 2. Fall back to apliiqNumericId stored at submission time
      // 3. Compute the numeric hash of the Firestore doc ID (matches what we sent to Apliiq)
      let lookupId = (!order.apliiqOrderId || order.apliiqOrderId === 'unknown')
        ? null
        : order.apliiqOrderId;

      if (!lookupId) {
        lookupId = order.apliiqNumericId || toNumericOrderId(doc.id);
        console.log(`[ApliiqPollJob] Order ${doc.id} has unknown apliiqOrderId; using computed lookupId=${lookupId}`);
      }

      try {
        const result = await getApliiqOrderStatus(lookupId);

        if (!result.success || !result.data) {
          console.log(`[ApliiqPollJob] Could not fetch status for order ${doc.id}`);
          continue;
        }

        const apliiqData = result.data;
        console.log(`[ApliiqPollJob] Order ${doc.id} Apliiq data:`, JSON.stringify(apliiqData));

        // Normalize tracking fields (Apliiq may use different casing)
        const trackingNumber =
          apliiqData.tracking_number ||
          apliiqData.trackingNumber ||
          apliiqData.tracking ||
          null;
        const carrier =
          apliiqData.carrier ||
          apliiqData.shipping_carrier ||
          apliiqData.shippingCarrier ||
          '';

        if (!trackingNumber || trackingNumber === order.trackingNumber) {
          // No new tracking info
          continue;
        }

        console.log(`[ApliiqPollJob] New tracking found for order ${doc.id}: ${trackingNumber}`);

        // Update order in Firestore
        await doc.ref.update({
          status: 'shipped',
          apliqStatus: 'shipped',
          trackingNumber,
          carrier,
          shippedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Send tracking email if not already sent
        if (!order.emailSent && order.customerEmail) {
          const emailResult = await sendTrackingEmail({
            orderId: doc.id,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            trackingNumber,
            carrier,
          });

          if (emailResult.success) {
            await doc.ref.update({
              emailSent: true,
              emailSentAt: FieldValue.serverTimestamp(),
            });
            console.log(`[ApliiqPollJob] Tracking email sent for order ${doc.id}`);
          } else {
            console.error(`[ApliiqPollJob] Failed to send tracking email for order ${doc.id}:`, emailResult.error);
          }
        }
      } catch (err) {
        console.error(`[ApliiqPollJob] Error processing order ${doc.id}:`, err);
      }
    }
  }
);

// Daily job: send delivery confirmation emails for orders shipped 7+ days ago.
// Apliiq cannot report carrier delivery, so we estimate arrival by time elapsed.
export const deliveryEmailJob = onSchedule(
  {
    schedule: '0 14 * * *', // 10 AM ET / 2 PM UTC daily
    secrets: [resendApiKey],
    region: 'us-central1',
  },
  async () => {
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const snapshot = await db
      .collection('orders')
      .where('status', '==', 'shipped')
      .where('shippedAt', '<', cutoff)
      .get();

    const pending = snapshot.docs.filter(doc => !doc.data().deliveryEmailSent);
    console.log(`[DeliveryEmailJob] ${pending.length} order(s) pending delivery email`);

    for (const doc of pending) {
      const order = doc.data();
      if (!order.customerEmail) continue;

      try {
        const result = await sendDeliveryEmail({
          orderId: doc.id,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
        });

        if (result.success) {
          await doc.ref.update({
            deliveryEmailSent: true,
            deliveryEmailSentAt: FieldValue.serverTimestamp(),
          });
          console.log(`[DeliveryEmailJob] Delivery email sent for order ${doc.id}`);
        } else {
          console.error(`[DeliveryEmailJob] Failed for order ${doc.id}:`, result.error);
        }
      } catch (err) {
        console.error(`[DeliveryEmailJob] Error for order ${doc.id}:`, err);
      }
    }
  }
);

/**
 * Firestore trigger: fires whenever an order document is updated.
 * Auto-sends the tracking email the moment a trackingNumber is added,
 * regardless of how it got there (Apliiq webhook, poll job, admin UI,
 * or direct Firestore edit). Idempotent: checks `emailSent` to avoid
 * double-sending.
 */
export const orderTrackingEmailTrigger = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    secrets: [resendApiKey],
    region: 'us-central1',
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const orderId = event.params.orderId;

    // Normalize to handle any field name variants that could exist in legacy docs
    const beforeTracking = before.trackingNumber || before.tracking_number || before.tracking || '';
    const afterTracking = after.trackingNumber || after.tracking_number || after.tracking || '';

    // Did a tracking number just appear (or change)? And we haven't sent the email yet?
    const trackingNewlySet = !beforeTracking && !!afterTracking;
    const trackingChanged = beforeTracking && afterTracking && beforeTracking !== afterTracking;
    const shouldSendTracking =
      (trackingNewlySet || trackingChanged) && !after.emailSent && !!after.customerEmail;

    if (shouldSendTracking) {
      try {
        console.log(`[OrderTrigger] Auto-sending tracking email for order ${orderId} (tracking=${afterTracking})`);
        const result = await sendTrackingEmail({
          orderId,
          customerEmail: after.customerEmail,
          customerName: after.customerName,
          trackingNumber: afterTracking,
          carrier: after.carrier || '',
        });

        if (result.success) {
          await event.data.after.ref.update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
          console.log(`[OrderTrigger] Tracking email sent for order ${orderId}`);
        } else {
          console.error(`[OrderTrigger] Tracking email failed for order ${orderId}:`, result.error);
        }
      } catch (err) {
        console.error(`[OrderTrigger] Error sending tracking email for order ${orderId}:`, err);
      }
    }

    // Auto-send delivery email the moment status flips to a "delivered" state.
    const deliveredStatuses = ['delivered', 'fulfillment_complete'];
    const becameDelivered =
      !deliveredStatuses.includes(before.status) &&
      deliveredStatuses.includes(after.status);

    if (becameDelivered && !after.deliveryEmailSent && !!after.customerEmail) {
      try {
        console.log(`[OrderTrigger] Auto-sending delivery email for order ${orderId}`);
        const result = await sendDeliveryEmail({
          orderId,
          customerEmail: after.customerEmail,
          customerName: after.customerName,
        });

        if (result.success) {
          await event.data.after.ref.update({
            deliveryEmailSent: true,
            deliveryEmailSentAt: FieldValue.serverTimestamp(),
          });
          console.log(`[OrderTrigger] Delivery email sent for order ${orderId}`);
        } else {
          console.error(`[OrderTrigger] Delivery email failed for order ${orderId}:`, result.error);
        }
      } catch (err) {
        console.error(`[OrderTrigger] Error sending delivery email for order ${orderId}:`, err);
      }
    }
  }
);