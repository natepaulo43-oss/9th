/**
 * Apliiq API Integration
 * Handles order submission to Apliiq print-on-demand supplier
 * 
 * API Documentation: https://apliiq.com/api
 * Authentication: HMAC-SHA256 request signing
 */

import crypto from 'crypto';
import axios from 'axios';
import { config } from './config.js';
import { getApliiqSku } from './apliiq-skus.js';

/**
 * @typedef {Object} ApliiqLineItem
 * @property {string} sku - Apliiq product SKU
 * @property {number} quantity - Quantity to order
 */

/**
 * @typedef {Object} ApliiqShippingAddress
 * @property {string} name - Recipient name
 * @property {string} address1 - Address line 1
 * @property {string} address2 - Address line 2 (optional)
 * @property {string} city - City
 * @property {string} state - State/Province code
 * @property {string} zip - Postal code
 * @property {string} country - Country code (US, CA)
 */

/**
 * @typedef {Object} ApliiqOrderPayload
 * @property {string} store - Store name (9thform)
 * @property {string} order_id - Unique order identifier
 * @property {ApliiqLineItem[]} line_items - Products to order
 * @property {ApliiqShippingAddress} shipping_address - Delivery address
 * @property {string} [email] - Customer email for notifications
 */

/**
 * @typedef {Object} ApliiqOrderResponse
 * @property {boolean} success - Whether the order was created successfully
 * @property {string} apliiq_order_id - Apliiq's internal order ID
 * @property {string} message - Response message
 */

/**
 * Generates HMAC-SHA256 signature for Apliiq API request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {Object} payload - Request body
 * @returns {string} Base64-encoded HMAC signature
 */
function generateApliiqSignature(method, path, payload = {}) {
  const { appKey, sharedSecret } = config.apliiq;
  
  // Create the string to sign: METHOD + PATH + JSON_PAYLOAD
  const payloadString = Object.keys(payload).length > 0 ? JSON.stringify(payload) : '';
  const stringToSign = `${method.toUpperCase()}${path}${payloadString}`;
  
  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', sharedSecret);
  hmac.update(stringToSign);
  const signature = hmac.digest('base64');
  
  return signature;
}

/**
 * Makes an authenticated request to the Apliiq API
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint path
 * @param {Object} payload - Request body
 * @returns {Promise<Object>} API response
 */
async function apliiqRequest(method, path, payload = {}) {
  const { appKey, baseUrl } = config.apliiq;
  
  if (!appKey || !config.apliiq.sharedSecret) {
    throw new Error('Apliiq API credentials not configured');
  }
  
  // Generate authentication signature
  const signature = generateApliiqSignature(method, path, payload);
  
  const url = `${baseUrl}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Apliiq-App-Key': appKey,
    'X-Apliiq-Signature': signature,
  };
  
  console.log(`[Apliiq API] ${method} ${path}`, {
    url,
    hasPayload: Object.keys(payload).length > 0,
  });
  
  try {
    const response = await axios({
      method,
      url,
      headers,
      data: Object.keys(payload).length > 0 ? payload : undefined,
      timeout: 30000, // 30 second timeout
    });
    
    console.log(`[Apliiq API] Response:`, {
      status: response.status,
      data: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error(`[Apliiq API] Error:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    throw new Error(
      `Apliiq API request failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * Converts Firestore order data to Apliiq order format
 * @param {Object} order - Firestore order document
 * @returns {ApliiqOrderPayload}
 */
function convertOrderToApliiqFormat(order) {
  // Map line items to Apliiq format with SKU lookup
  const lineItems = [];
  
  if (!order.items || !Array.isArray(order.items)) {
    throw new Error('Order has no line items');
  }
  
  for (const item of order.items) {
    // Get product details from the catalog
    const productName = item.product?.name || item.productName;
    const size = item.size || item.variant || 'ONE_SIZE';
    const quantity = item.quantity || 1;
    
    if (!productName) {
      throw new Error(`Line item missing product name: ${JSON.stringify(item)}`);
    }
    
    // Look up Apliiq SKU
    const apliiqSku = getApliiqSku(productName, size);
    
    if (!apliiqSku) {
      throw new Error(`No Apliiq SKU mapping found for ${productName} (size: ${size})`);
    }
    
    lineItems.push({
      sku: apliiqSku,
      quantity,
    });
  }
  
  if (lineItems.length === 0) {
    throw new Error('No valid line items to submit to Apliiq');
  }
  
  // Format shipping address
  const shippingAddress = order.shippingAddress || {};
  
  const apliiqShippingAddress = {
    name: order.shippingName || order.customerName || '',
    address1: shippingAddress.line1 || '',
    address2: shippingAddress.line2 || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    zip: shippingAddress.postal_code || shippingAddress.zip || '',
    country: shippingAddress.country || 'US',
  };
  
  // Validate required fields
  if (!apliiqShippingAddress.name) {
    throw new Error('Shipping name is required');
  }
  if (!apliiqShippingAddress.address1) {
    throw new Error('Shipping address is required');
  }
  if (!apliiqShippingAddress.city) {
    throw new Error('Shipping city is required');
  }
  if (!apliiqShippingAddress.state) {
    throw new Error('Shipping state is required');
  }
  if (!apliiqShippingAddress.zip) {
    throw new Error('Shipping zip code is required');
  }
  
  // Build Apliiq order payload
  const payload = {
    store: config.apliiq.store,
    order_id: order.id || order.stripeSessionId,
    line_items: lineItems,
    shipping_address: apliiqShippingAddress,
  };
  
  // Add customer email if available
  if (order.customerEmail) {
    payload.email = order.customerEmail;
  }
  
  return payload;
}

/**
 * Submits an order to Apliiq for fulfillment
 * @param {Object} order - Firestore order document (must include id field)
 * @returns {Promise<{success: boolean, apliiqOrderId?: string, error?: string}>}
 */
export async function submitOrderToApliiq(order) {
  try {
    console.log(`[Apliiq] Submitting order ${order.id} to Apliiq`);
    
    // Convert order to Apliiq format
    const apliiqPayload = convertOrderToApliiqFormat(order);
    
    console.log(`[Apliiq] Order payload:`, JSON.stringify(apliiqPayload, null, 2));
    
    // Submit order to Apliiq API
    // Endpoint: POST /orders
    const response = await apliiqRequest('POST', '/orders', apliiqPayload);
    
    if (!response || !response.apliiq_order_id) {
      throw new Error('Invalid response from Apliiq API - missing order ID');
    }
    
    console.log(`[Apliiq] Order submitted successfully:`, {
      orderId: order.id,
      apliiqOrderId: response.apliiq_order_id,
    });
    
    return {
      success: true,
      apliiqOrderId: response.apliiq_order_id,
    };
  } catch (error) {
    console.error(`[Apliiq] Failed to submit order ${order.id}:`, error);
    
    return {
      success: false,
      error: error.message || 'Failed to submit order to Apliiq',
    };
  }
}

/**
 * Validates Apliiq webhook signature
 * @param {string} signature - Signature from webhook headers
 * @param {string} payload - Raw webhook payload
 * @returns {boolean} Whether signature is valid
 */
export function validateApliiqWebhookSignature(signature, payload) {
  const { sharedSecret } = config.apliiq;
  
  if (!sharedSecret) {
    console.error('[Apliiq Webhook] Shared secret not configured');
    return false;
  }
  
  // Generate expected signature
  const hmac = crypto.createHmac('sha256', sharedSecret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');
  
  // Compare signatures (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parses tracking URL based on carrier
 * @param {string} carrier - Carrier name (USPS, UPS, FedEx, etc.)
 * @param {string} trackingNumber - Tracking number
 * @returns {string} Tracking URL
 */
export function getTrackingUrl(carrier, trackingNumber) {
  const normalizedCarrier = carrier?.toUpperCase() || '';
  
  const trackingUrls = {
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FEDEX': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  
  return trackingUrls[normalizedCarrier] || `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`;
}
