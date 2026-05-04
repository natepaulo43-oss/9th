import express from 'express';
import {
  getOrders,
  getOrder,
  updateOrder,
  markOrderSubmittedToApliiq,
  markOrderFulfilled,
  getOrderStats,
} from '../services/orderService.js';
import { verifyToken } from '../middleware/auth.js';
import { lenientRateLimiter } from '../middleware/rateLimiter.js';
import {
  validateOrderId,
  validateOrderUpdate,
  validateOrderQuery,
} from '../middleware/validation.js';
import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  sendReceiptEmail,
  sendTrackingEmail,
  sendDeliveryEmail,
} from '../lib/email.js';

const router = express.Router();

/**
 * POST /orders/admin/resend-emails
 * Admin utility to (re)send transactional emails for an existing order.
 * Auth: `Authorization: Bearer <STRIPE_WEBHOOK_SECRET>` (reuses an existing secret).
 * Body: { orderId: string, types?: Array<'receipt'|'tracking'|'delivery'> }
 * Mounted BEFORE verifyToken so it does not require a user ID token.
 */
router.post('/admin/resend-emails', async (req, res) => {
  try {
    const adminSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const authHeader = req.headers['authorization'] || '';
    const provided = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';

    if (!adminSecret || provided !== adminSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, customerEmail, types, trackingNumber, carrier } = req.body || {};
    if (!orderId && !customerEmail) {
      return res.status(400).json({ error: 'orderId or customerEmail is required' });
    }

    const requestedTypes = Array.isArray(types) && types.length > 0
      ? types
      : ['receipt', 'tracking', 'delivery'];

    let orderRef;
    let orderDoc;
    if (orderId) {
      orderRef = db.collection('orders').doc(orderId);
      orderDoc = await orderRef.get();
    } else {
      const snap = await db
        .collection('orders')
        .where('customerEmail', '==', customerEmail)
        .get();
      if (snap.empty) {
        return res.status(404).json({ error: 'No order found for customerEmail' });
      }
      // Pick the most recently created doc client-side to avoid requiring a composite index
      const docs = snap.docs.slice().sort((a, b) => {
        const toMs = (d) => {
          const v = d.get('createdAt');
          if (!v) return 0;
          if (typeof v.toMillis === 'function') return v.toMillis();
          if (v instanceof Date) return v.getTime();
          const t = new Date(v).getTime();
          return Number.isFinite(t) ? t : 0;
        };
        return toMs(b) - toMs(a);
      });
      orderDoc = docs[0];
      orderRef = orderDoc.ref;
    }

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const resolvedOrderId = orderDoc.id;
    let order = orderDoc.data();

    // Optionally patch tracking info on the order before sending tracking email
    if (trackingNumber) {
      await orderRef.update({
        trackingNumber,
        carrier: carrier || order.carrier || '',
        status: order.status || 'shipped',
      });
      order = { ...order, trackingNumber, carrier: carrier || order.carrier || '' };
    }

    const results = {};

    if (requestedTypes.includes('receipt')) {
      results.receipt = await sendReceiptEmail({
        orderId: resolvedOrderId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        items: order.items,
        amountSubtotal: order.amountSubtotal,
        amountTotal: order.amountTotal,
        currency: order.currency,
        shippingAddress: order.shippingAddress,
        shippingName: order.shippingName,
      });
    }

    if (requestedTypes.includes('tracking')) {
      if (!order.trackingNumber) {
        results.tracking = { success: false, error: 'No trackingNumber on order' };
      } else {
        results.tracking = await sendTrackingEmail({
          orderId: resolvedOrderId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
        });
        if (results.tracking.success) {
          await orderRef.update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }

    if (requestedTypes.includes('delivery')) {
      results.delivery = await sendDeliveryEmail({
        orderId: resolvedOrderId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      });
    }

    return res.json({ orderId: resolvedOrderId, results });
  } catch (error) {
    console.error('[Admin] resend-emails error:', error);
    return res.status(500).json({ error: error.message || 'Failed to resend emails' });
  }
});

/**
 * POST /orders/admin/force-apliiq-sync
 * Immediately polls Apliiq for tracking on all submitted orders that lack one.
 * Updating Firestore with a tracking number triggers orderTrackingEmailTrigger,
 * which auto-sends the customer email.
 * Auth: `Authorization: Bearer <STRIPE_WEBHOOK_SECRET>`
 */
router.post('/admin/force-apliiq-sync', async (req, res) => {
  try {
    const adminSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const authHeader = req.headers['authorization'] || '';
    const provided = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';

    if (!adminSecret || provided !== adminSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { getApliiqOrderStatus, toNumericOrderId } = await import('../lib/apliiq.js');
    const { FieldValue } = await import('firebase-admin/firestore');

    const snapshot = await db
      .collection('orders')
      .where('apliqStatus', 'in', ['submitted', 'submitted_to_supplier'])
      .get();

    const results = [];

    for (const doc of snapshot.docs) {
      const order = doc.data();

      // Skip orders that already have a tracking number
      if (order.trackingNumber) {
        results.push({ orderId: doc.id, status: 'skipped', reason: 'already_has_tracking' });
        continue;
      }

      // Resolve the best lookup ID (same logic as the poll job)
      let lookupId = (!order.apliiqOrderId || order.apliiqOrderId === 'unknown')
        ? null
        : order.apliiqOrderId;
      if (!lookupId) {
        lookupId = order.apliiqNumericId || toNumericOrderId(doc.id);
      }

      try {
        const apliiqResult = await getApliiqOrderStatus(lookupId);

        if (!apliiqResult.success || !apliiqResult.data) {
          results.push({ orderId: doc.id, lookupId, status: 'apliiq_fetch_failed', error: apliiqResult.error });
          continue;
        }

        // Apliiq returns an array; grab first element
        const apliiqData = Array.isArray(apliiqResult.data) ? apliiqResult.data[0] : apliiqResult.data;
        const sn = apliiqData?.SN?.[0] || apliiqData?.sn?.[0];
        const trackingNumber =
          sn?.TrackingNumber ||
          sn?.trackingNumber ||
          sn?.tracking_number ||
          apliiqData?.tracking_number ||
          apliiqData?.trackingNumber ||
          apliiqData?.tracking ||
          null;
        const serviceName = sn?.Service || sn?.service || apliiqData?.carrier || '';
        const carrier = serviceName.match(/\b(USPS|UPS|FedEx|DHL)\b/i)?.[1]?.toUpperCase() || '';

        if (!trackingNumber) {
          results.push({ orderId: doc.id, lookupId, status: 'no_tracking_yet' });
          continue;
        }

        // Update Firestore — orderTrackingEmailTrigger fires and sends the email
        await doc.ref.update({
          status: 'shipped',
          apliqStatus: 'shipped',
          trackingNumber,
          carrier,
          shippedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        results.push({ orderId: doc.id, lookupId, status: 'updated', trackingNumber, carrier });
      } catch (err) {
        results.push({ orderId: doc.id, lookupId, status: 'error', error: err.message });
      }
    }

    const updated = results.filter(r => r.status === 'updated').length;
    console.log(`[ForceApliiqSync] Processed ${results.length} order(s), updated ${updated}`);
    return res.json({ processed: results.length, updated, results });
  } catch (error) {
    console.error('[Admin] force-apliiq-sync error:', error);
    return res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

// All order routes below require authentication
router.use(verifyToken);
router.use(lenientRateLimiter);

/**
 * POST /orders/resend-email
 * Resend a tracking or delivery email for an order.
 * Auth: Firebase ID token (admin dashboard).
 * Body: { orderId: string, types: Array<'tracking'|'delivery'> }
 */
router.post('/resend-email', async (req, res) => {
  try {
    const { orderId, types } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const requestedTypes = Array.isArray(types) && types.length > 0
      ? types
      : ['tracking'];

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderDoc.data();
    const results = {};

    if (requestedTypes.includes('tracking')) {
      // Accept common field-name variants in case legacy / manually-edited docs
      // store tracking under a different key.
      const trackingNumber =
        order.trackingNumber ||
        order.tracking_number ||
        order.tracking ||
        '';
      const carrier = order.carrier || order.shipping_carrier || order.shippingCarrier || '';

      if (!trackingNumber) {
        console.warn(
          `[Orders] resend-email: no tracking field on order ${orderId}. Keys present:`,
          Object.keys(order)
        );
        results.tracking = {
          success: false,
          error: 'No trackingNumber on order',
          fieldsPresent: Object.keys(order),
        };
      } else {
        results.tracking = await sendTrackingEmail({
          orderId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          trackingNumber,
          carrier,
        });
        if (results.tracking.success) {
          await db.collection('orders').doc(orderId).update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }

    if (requestedTypes.includes('delivery')) {
      results.delivery = await sendDeliveryEmail({
        orderId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      });
      if (results.delivery.success) {
        await db.collection('orders').doc(orderId).update({
          deliveryEmailSent: true,
          deliveryEmailSentAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return res.json({ orderId, results });
  } catch (error) {
    console.error('[Orders] resend-email error:', error);
    return res.status(500).json({ error: error.message || 'Failed to resend email' });
  }
});

router.get('/', validateOrderQuery, async (req, res) => {
  try {
    const { status, apliqStatus, limit, startAfter } = req.query;
    
    const result = await getOrders({
      status,
      apliqStatus,
      limit: limit ? parseInt(limit, 10) : 50,
      startAfter,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await getOrderStats();

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

router.get('/:orderId', validateOrderId, async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await getOrder(orderId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.patch('/:orderId', validateOrderId, validateOrderUpdate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    const result = await updateOrder(orderId, updates);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/:orderId/submit-to-apliiq', validateOrderId, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { apliqOrderId } = req.body;

    const result = await markOrderSubmittedToApliiq(orderId, apliqOrderId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: 'Order marked as submitted to Apliiq' });
  } catch (error) {
    console.error('Error marking order as submitted:', error);
    res.status(500).json({ error: 'Failed to mark order as submitted' });
  }
});

router.post('/:orderId/fulfill', validateOrderId, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const result = await markOrderFulfilled(orderId, trackingNumber);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const order = result.data;
    const emailResults = {};

    if (trackingNumber && order?.customerEmail) {
      try {
        const trackingResult = await sendTrackingEmail({
          orderId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          trackingNumber,
          carrier: carrier || order.carrier || '',
        });
        emailResults.tracking = trackingResult;

        if (trackingResult.success) {
          await db.collection('orders').doc(orderId).update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (emailError) {
        console.error('[Fulfill] Error sending tracking email:', emailError);
        emailResults.tracking = { success: false, error: emailError.message };
      }
    }

    res.json({ message: 'Order marked as fulfilled', emailResults });
  } catch (error) {
    console.error('Error marking order as fulfilled:', error);
    res.status(500).json({ error: 'Failed to mark order as fulfilled' });
  }
});

export default router;
