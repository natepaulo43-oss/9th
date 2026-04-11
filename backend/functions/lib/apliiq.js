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
import { getFullStateName } from './stateMapping.js';

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
 * Format: RTS:SIG:APPID:STATE
 * SIG = base64_encode(HMACSHA256([APPID][RTS][STATE][Base64_ReqContent], SHARED_SECRET))
 * @param {string} appKey - Apliiq App Key
 * @param {string} sharedSecret - Apliiq Shared Secret
 * @param {number} timestamp - Request timestamp (UNIX time)
 * @param {string} nonce - Random unique string
 * @param {Object} payload - Request body
 * @returns {string} Authorization header value
 */
function generateApliiqAuthHeader(appKey, sharedSecret, timestamp, nonce, payload = {}) {
  // Base64 encode the request content (or empty string if no payload)
  const payloadString = Object.keys(payload).length > 0 ? JSON.stringify(payload) : '';
  const base64Content = Buffer.from(payloadString).toString('base64');
  
  // Create string to sign: [APPID][RTS][STATE][Base64_ReqContent]
  const stringToSign = `${appKey}${timestamp}${nonce}${base64Content}`;
  
  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', sharedSecret);
  hmac.update(stringToSign);
  const signature = hmac.digest('base64');
  
  // Return format: RTS:SIG:APPID:STATE (caller prepends the scheme name)
  return `${timestamp}:${signature}:${appKey}:${nonce}`;
}

/**
 * Converts a Firestore string ID to a stable unsigned 32-bit integer.
 * Apliiq's API docs show numeric values for `number` and `order_number`.
 * @param {string} strId
 * @returns {number}
 */
function toNumericOrderId(strId) {
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = (hash * 31 + strId.charCodeAt(i)) >>> 0; // keep unsigned 32-bit
  }
  return hash;
}

/**
 * Makes an authenticated request to the Apliiq API
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint path
 * @param {Object} payload - Request body
 * @returns {Promise<Object>} API response
 */
async function apliiqRequest(method, path, payload = {}) {
  const { appKey, sharedSecret, baseUrl } = config.apliiq;
  
  if (!appKey || !sharedSecret) {
    throw new Error('Apliiq API credentials not configured');
  }
  
  console.log('[Apliiq API] Credentials check:', {
    hasAppKey: !!appKey,
    appKeyLength: appKey?.length,
    hasSharedSecret: !!sharedSecret,
    sharedSecretLength: sharedSecret?.length,
    baseUrl,
  });
  
  // Generate timestamp and nonce for authentication
  const timestamp = Math.floor(Date.now() / 1000); // UNIX timestamp
  const nonce = crypto.randomBytes(16).toString('hex'); // Random unique string
  
  // Generate authentication header
  const authHeader = generateApliiqAuthHeader(appKey, sharedSecret, timestamp, nonce, payload);
  
  const url = `${baseUrl}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `x-apliiq-auth ${authHeader}`,
  };
  
  console.log(`[Apliiq API] ${method} ${path}`, {
    url,
    hasPayload: Object.keys(payload).length > 0,
    timestamp,
    nonce,
    authHeaderFormat: authHeader.split(':').map((part, i) => i === 1 ? '[SIGNATURE]' : part.substring(0, 10) + '...').join(':'),
  });
  
  // Log EXACT headers being sent on the wire
  console.log('[Apliiq API] EXACT REQUEST HEADERS:', {
    'Content-Type': headers['Content-Type'],
    'Accept': headers['Accept'],
    'Authorization': headers['Authorization'],
  });
  
  console.log('[Apliiq API] Auth Header Breakdown:', {
    headerName: 'Authorization',
    scheme: 'x-apliiq-auth',
    format: 'x-apliiq-auth RTS:SIG:APPID:STATE',
    parts: {
      RTS: authHeader.split(':')[0],
      SIG: authHeader.split(':')[1]?.substring(0, 20) + '...',
      APPID: authHeader.split(':')[2],
      STATE: authHeader.split(':')[3],
    }
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
      `Apliiq API request failed: ${error.response?.data?.Message || error.response?.data?.message || error.message}`
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
    const priceInCents = item.price || item.product?.price || 0;
    
    if (!productName) {
      throw new Error(`Line item missing product name: ${JSON.stringify(item)}`);
    }
    
    // Look up Apliiq SKU
    const apliiqSku = getApliiqSku(productName, size);
    
    if (!apliiqSku) {
      throw new Error(`No Apliiq SKU mapping found for ${productName} (size: ${size})`);
    }
    
    // Convert price from cents to dollars (must be a number, not a string)
    const priceInDollars = parseFloat((priceInCents / 100).toFixed(2));
    
    lineItems.push({
      id: toNumericOrderId(`${order.id}-${lineItems.length + 1}`),
      title: productName,
      name: `${productName} - ${size}`,
      quantity: quantity,
      price: priceInDollars,
      sku: apliiqSku,
      grams: 0,
    });
  }
  
  if (lineItems.length === 0) {
    throw new Error('No valid line items to submit to Apliiq');
  }
  
  // Format shipping address
  const shippingAddress = order.shippingAddress || {};
  const nameParts = (order.shippingName || order.customerName || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Get state code (2 letters for US)
  const stateCode = shippingAddress.state || '';
  const countryCode = (shippingAddress.country || 'US').toUpperCase();
  
  // Convert state code to full state name for province field
  const fullStateName = getFullStateName(stateCode, countryCode);
  
  const apliiqShippingAddress = {
    first_name: firstName,
    last_name: lastName,
    name: order.shippingName || order.customerName || '',
    address1: shippingAddress.line1 || '',
    address2: shippingAddress.line2 || '',
    city: shippingAddress.city || '',
    zip: shippingAddress.postal_code || shippingAddress.zip || '',
    province: fullStateName,
    province_code: stateCode,
    country: countryCode === 'US' ? 'United States' : shippingAddress.country || 'United States',
    country_code: countryCode,
    phone: order.customerPhone || '',
  };
  
  // Validate required fields per Apliiq API specification
  if (!apliiqShippingAddress.first_name) {
    throw new Error('Shipping first name is required');
  }
  if (!apliiqShippingAddress.last_name) {
    throw new Error('Shipping last name is required');
  }
  if (!apliiqShippingAddress.address1) {
    throw new Error('Shipping address is required');
  }
  if (!apliiqShippingAddress.city) {
    throw new Error('Shipping city is required');
  }
  if (!apliiqShippingAddress.province) {
    throw new Error('Shipping state/province is required');
  }
  if (!apliiqShippingAddress.zip) {
    throw new Error('Shipping zip code is required');
  }
  if (countryCode === 'US' && !apliiqShippingAddress.province_code) {
    throw new Error('Shipping province_code (2-letter state code) is required for US orders');
  }
  
  // Build Apliiq order payload per their API specification
  const orderId = order.id || order.stripeSessionId;
  const numericId = toNumericOrderId(orderId);
  const payload = {
    id: numericId,
    number: numericId,
    name: `#${numericId}`,
    order_number: numericId,
    email: order.customerEmail || '',
    line_items: lineItems,
    shipping_address: apliiqShippingAddress,
    shipping_lines: [{
      code: "standard"
    }]
  };
  
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
    // Endpoint: POST /v1/Order
    const response = await apliiqRequest('POST', '/v1/Order', apliiqPayload);
    
    // Apliiq may return id, order_id, or orderId — accept any
    const apliiqOrderId = response?.id || response?.order_id || response?.orderId;
    
    console.log(`[Apliiq] Order submitted successfully (full response):`, JSON.stringify(response));
    console.log(`[Apliiq] Order submitted:`, {
      orderId: order.id,
      apliiqOrderId,
    });
    
    return {
      success: true,
      apliiqOrderId: apliiqOrderId || 'unknown',
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
