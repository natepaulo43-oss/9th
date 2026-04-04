/**
 * Apliiq Webhook Handlers
 * Receives fulfillment notifications from Apliiq
 * 
 * Webhook URLs to configure in Apliiq dashboard:
 * - Fulfillment: https://9thform.com/api/webhooks/apliiq/fulfillment
 * - Shipment Complete: https://9thform.com/api/webhooks/apliiq/shipment-complete
 */

import express from 'express';
import { db } from '../config/firebase.js';
import { validateApliiqWebhookSignature } from '../lib/apliiq.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = express.Router();

/**
 * Validates Apliiq webhook request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validateApliiqWebhook(req, res, next) {
  const signature = req.headers['x-apliiq-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);
  
  if (!signature) {
    console.error('[Apliiq Webhook] Missing signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  try {
    const isValid = validateApliiqWebhookSignature(signature, rawBody);
    
    if (!isValid) {
      console.error('[Apliiq Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
  } catch (error) {
    console.error('[Apliiq Webhook] Signature validation error:', error);
    return res.status(401).json({ error: 'Signature validation failed' });
  }
}

/**
 * Finds order by Apliiq order ID
 * @param {string} apliiqOrderId
 * @returns {Promise<{id: string, data: Object} | null>}
 */
async function findOrderByApliiqId(apliiqOrderId) {
  try {
    const snapshot = await db
      .collection('orders')
      .where('apliiqOrderId', '==', apliiqOrderId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      data: doc.data(),
    };
  } catch (error) {
    console.error('[Apliiq Webhook] Error finding order:', error);
    throw error;
  }
}

/**
 * POST /webhooks/apliiq/fulfillment
 * Receives tracking info when Apliiq ships the order
 */
router.post('/fulfillment', validateApliiqWebhook, async (req, res) => {
  // Return 200 immediately to acknowledge receipt
  res.status(200).json({ received: true });
  
  // Process webhook asynchronously
  (async () => {
    try {
      const {
        apliiq_order_id,
        tracking_number,
        carrier,
        shipped_at,
      } = req.body;
      
      console.log('[Apliiq Webhook] Fulfillment notification received:', {
        apliiq_order_id,
        tracking_number,
        carrier,
      });
      
      if (!apliiq_order_id) {
        console.error('[Apliiq Webhook] Missing apliiq_order_id');
        return;
      }
      
      // Find order by Apliiq order ID
      const order = await findOrderByApliiqId(apliiq_order_id);
      
      if (!order) {
        console.error('[Apliiq Webhook] Order not found:', apliiq_order_id);
        return;
      }
      
      console.log('[Apliiq Webhook] Found order:', order.id);
      
      // Update order with tracking information
      const updateData = {
        status: 'shipped',
        apliqStatus: 'shipped',
        trackingNumber: tracking_number || '',
        carrier: carrier || '',
        shippedAt: shipped_at ? new Date(shipped_at) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('orders').doc(order.id).update(updateData);
      
      console.log('[Apliiq Webhook] Order updated with tracking info:', {
        orderId: order.id,
        trackingNumber: tracking_number,
        carrier,
      });
      
      // Import and send tracking email
      // Note: This will be implemented in the next step
      try {
        const { sendTrackingEmail } = await import('../lib/email.js');
        
        const emailResult = await sendTrackingEmail({
          orderId: order.id,
          customerEmail: order.data.customerEmail,
          customerName: order.data.customerName,
          trackingNumber: tracking_number,
          carrier: carrier,
        });
        
        if (emailResult.success) {
          await db.collection('orders').doc(order.id).update({
            emailSent: true,
            emailSentAt: FieldValue.serverTimestamp(),
          });
          
          console.log('[Apliiq Webhook] Tracking email sent successfully');
        } else {
          console.error('[Apliiq Webhook] Failed to send tracking email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('[Apliiq Webhook] Error sending tracking email:', emailError);
        // Don't fail the webhook if email fails
      }
    } catch (error) {
      console.error('[Apliiq Webhook] Error processing fulfillment webhook:', error);
    }
  })();
});

/**
 * POST /webhooks/apliiq/shipment-complete
 * Fires when warehouse confirms shipment is complete
 */
router.post('/shipment-complete', validateApliiqWebhook, async (req, res) => {
  // Return 200 immediately to acknowledge receipt
  res.status(200).json({ received: true });
  
  // Process webhook asynchronously
  (async () => {
    try {
      const {
        apliiq_order_id,
        completed_at,
      } = req.body;
      
      console.log('[Apliiq Webhook] Shipment complete notification received:', {
        apliiq_order_id,
        completed_at,
      });
      
      if (!apliiq_order_id) {
        console.error('[Apliiq Webhook] Missing apliiq_order_id');
        return;
      }
      
      // Find order by Apliiq order ID
      const order = await findOrderByApliiqId(apliiq_order_id);
      
      if (!order) {
        console.error('[Apliiq Webhook] Order not found:', apliiq_order_id);
        return;
      }
      
      console.log('[Apliiq Webhook] Found order:', order.id);
      
      // Update order status to fulfillment complete
      const updateData = {
        status: 'fulfillment_complete',
        apliqStatus: 'fulfillment_complete',
        fulfilledAt: completed_at ? new Date(completed_at) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('orders').doc(order.id).update(updateData);
      
      console.log('[Apliiq Webhook] Order marked as fulfillment complete:', order.id);
    } catch (error) {
      console.error('[Apliiq Webhook] Error processing shipment-complete webhook:', error);
    }
  })();
});

export default router;
