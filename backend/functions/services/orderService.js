import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const ORDERS_COLLECTION = 'orders';

const formatResponse = (success, data = null, error = null) => ({ success, data, error });

/**
 * Creates a new order in Firestore from Stripe checkout session
 * @param {Object} orderData - Order data from Stripe
 * @returns {Promise<{success: boolean, data: { id: string } | null, error: string | null}>}
 */
export async function createOrder(orderData) {
  try {
    const order = {
      ...orderData,
      status: 'pending',
      apliqStatus: 'not_submitted',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(ORDERS_COLLECTION).add(order);
    return formatResponse(true, { id: docRef.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return formatResponse(false, null, error.message || 'Failed to create order');
  }
}

/**
 * Gets a single order by ID
 * @param {string} orderId
 * @returns {Promise<{success: boolean, data: Object | null, error: string | null}>}
 */
export async function getOrder(orderId) {
  try {
    const docSnap = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
    
    if (!docSnap.exists) {
      return formatResponse(false, null, 'Order not found');
    }

    return formatResponse(true, { id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error('Error getting order:', error);
    return formatResponse(false, null, error.message || 'Failed to get order');
  }
}

/**
 * Gets all orders with optional filtering and pagination
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by order status
 * @param {string} [options.apliqStatus] - Filter by Apliiq submission status
 * @param {number} [options.limit=50] - Number of orders to return
 * @param {string} [options.startAfter] - Cursor for pagination
 * @returns {Promise<{success: boolean, data: Object | null, error: string | null}>}
 */
export async function getOrders({ status, apliqStatus, limit = 50, startAfter } = {}) {
  try {
    let query = db.collection(ORDERS_COLLECTION).orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (apliqStatus) {
      query = query.where('apliqStatus', '==', apliqStatus);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (startAfter) {
      const cursorSnap = await db.collection(ORDERS_COLLECTION).doc(startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    }));

    const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return formatResponse(true, { orders, nextCursor, total: orders.length });
  } catch (error) {
    console.error('Error getting orders:', error);
    return formatResponse(false, null, error.message || 'Failed to get orders');
  }
}

/**
 * Updates an order's status
 * @param {string} orderId
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function updateOrder(orderId, updates) {
  try {
    const updateData = {
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection(ORDERS_COLLECTION).doc(orderId).update(updateData);
    return formatResponse(true);
  } catch (error) {
    console.error('Error updating order:', error);
    return formatResponse(false, null, error.message || 'Failed to update order');
  }
}

/**
 * Marks an order as submitted to Apliiq
 * @param {string} orderId
 * @param {string} [apliqOrderId] - Optional Apliiq order ID
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function markOrderSubmittedToApliiq(orderId, apliqOrderId = null) {
  try {
    const updateData = {
      apliqStatus: 'submitted',
      apliqSubmittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (apliqOrderId) {
      updateData.apliiqOrderId = apliqOrderId;
    }

    await db.collection(ORDERS_COLLECTION).doc(orderId).update(updateData);
    return formatResponse(true);
  } catch (error) {
    console.error('Error marking order as submitted:', error);
    return formatResponse(false, null, error.message || 'Failed to mark order as submitted');
  }
}

/**
 * Marks an order as fulfilled
 * @param {string} orderId
 * @param {string} [trackingNumber] - Optional tracking number
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function markOrderFulfilled(orderId, trackingNumber = null) {
  try {
    const updateData = {
      status: 'shipped',
      apliqStatus: 'fulfilled',
      shippedAt: FieldValue.serverTimestamp(),
      fulfilledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
      updateData.carrier = updateData.carrier || '';
    }

    await db.collection(ORDERS_COLLECTION).doc(orderId).update(updateData);

    const doc = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
    return formatResponse(true, { id: orderId, ...doc.data() });
  } catch (error) {
    console.error('Error marking order as fulfilled:', error);
    return formatResponse(false, null, error.message || 'Failed to mark order as fulfilled');
  }
}

/**
 * Gets order statistics
 * @returns {Promise<{success: boolean, data: Object | null, error: string | null}>}
 */
export async function getOrderStats() {
  try {
    const allOrders = await db.collection(ORDERS_COLLECTION).get();
    
    const stats = {
      total: allOrders.size,
      pending: 0,
      submitted: 0,
      fulfilled: 0,
      notSubmitted: 0,
    };

    allOrders.forEach((doc) => {
      const data = doc.data();
      
      if (data.status === 'fulfilled' || data.status === 'shipped' || data.status === 'fulfillment_complete') {
        stats.fulfilled++;
      } else if (data.status === 'pending') {
        stats.pending++;
      }

      if (data.apliqStatus === 'not_submitted') {
        stats.notSubmitted++;
      } else if (data.apliqStatus === 'submitted') {
        stats.submitted++;
      }
    });

    return formatResponse(true, stats);
  } catch (error) {
    console.error('Error getting order stats:', error);
    return formatResponse(false, null, error.message || 'Failed to get order stats');
  }
}
