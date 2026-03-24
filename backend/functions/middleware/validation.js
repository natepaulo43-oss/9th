/**
 * Input validation and sanitization middleware
 * Helps prevent injection attacks and data corruption
 */

/**
 * Validate and sanitize order ID parameter
 */
export function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  
  // Firestore document IDs should be alphanumeric with limited special chars
  if (!/^[a-zA-Z0-9_-]{1,1500}$/.test(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID format' });
  }
  
  next();
}

/**
 * Validate checkout session request body
 */
export function validateCheckoutSession(req, res, next) {
  const { items, successUrl, cancelUrl } = req.body || {};
  
  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required and must be a non-empty array' });
  }
  
  if (items.length > 100) {
    return res.status(400).json({ error: 'Too many items in cart' });
  }
  
  // Validate each item
  for (const item of items) {
    if (!item.productId || typeof item.productId !== 'string') {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const quantity = parseInt(item.quantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: 'Invalid quantity (must be between 1 and 99)' });
    }
  }
  
  // Validate URLs if provided
  if (successUrl && !isValidUrl(successUrl)) {
    return res.status(400).json({ error: 'Invalid success URL' });
  }
  
  if (cancelUrl && !isValidUrl(cancelUrl)) {
    return res.status(400).json({ error: 'Invalid cancel URL' });
  }
  
  next();
}

/**
 * Validate order update request body
 */
export function validateOrderUpdate(req, res, next) {
  const updates = req.body;
  
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  
  // Whitelist allowed fields
  const allowedFields = ['apliqStatus', 'apliqOrderId', 'trackingNumber', 'notes'];
  const providedFields = Object.keys(updates);
  
  const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
  }
  
  // Validate apliqStatus if provided
  if (updates.apliqStatus) {
    const validStatuses = ['not_submitted', 'submitted', 'fulfilled'];
    if (!validStatuses.includes(updates.apliqStatus)) {
      return res.status(400).json({ error: 'Invalid apliqStatus value' });
    }
  }
  
  // Validate string fields length
  if (updates.apliqOrderId && updates.apliqOrderId.length > 200) {
    return res.status(400).json({ error: 'apliqOrderId too long' });
  }
  
  if (updates.trackingNumber && updates.trackingNumber.length > 200) {
    return res.status(400).json({ error: 'trackingNumber too long' });
  }
  
  if (updates.notes && updates.notes.length > 5000) {
    return res.status(400).json({ error: 'notes too long' });
  }
  
  next();
}

/**
 * Validate query parameters for order listing
 */
export function validateOrderQuery(req, res, next) {
  const { limit, apliqStatus } = req.query;
  
  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be between 1 and 100)' });
    }
  }
  
  if (apliqStatus) {
    const validStatuses = ['not_submitted', 'submitted', 'fulfilled'];
    if (!validStatuses.includes(apliqStatus)) {
      return res.status(400).json({ error: 'Invalid apliqStatus filter' });
    }
  }
  
  next();
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove any HTML tags and dangerous characters
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 10000); // Max length
}

/**
 * General request body size limiter
 */
export function validateBodySize(req, res, next) {
  const contentLength = req.headers['content-length'];
  
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) { // 1MB limit
    return res.status(413).json({ error: 'Request body too large' });
  }
  
  next();
}
