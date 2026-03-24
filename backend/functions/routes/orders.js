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

const router = express.Router();

// All order routes require authentication
router.use(verifyToken);
router.use(lenientRateLimiter);

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
    const { trackingNumber } = req.body;

    const result = await markOrderFulfilled(orderId, trackingNumber);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ message: 'Order marked as fulfilled' });
  } catch (error) {
    console.error('Error marking order as fulfilled:', error);
    res.status(500).json({ error: 'Failed to mark order as fulfilled' });
  }
});

export default router;
