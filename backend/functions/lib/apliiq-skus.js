/**
 * Product SKU mapping for Apliiq integration
 * Maps 9thform products to their corresponding Apliiq SKUs
 */

/**
 * @typedef {Object} ApliiqSkuMapping
 * @property {string} productName - Display name of the product
 * @property {Object.<string, string>} skus - Size to Apliiq SKU mapping
 */

/**
 * Product SKU mappings
 * Key: Product name as stored in Firestore
 * Value: Object with size variants mapped to Apliiq SKUs
 */
export const APLIIQ_SKU_MAPPINGS = {
  'Canvas 9thform Falling Guy Hat': {
    productName: 'Canvas 9thform Falling Guy Hat',
    skus: {
      'ONE_SIZE': 'APQ-5785451S34A1',
    },
  },
  
  'Canvas 9thform Skate Hat': {
    productName: 'Canvas 9thform Skate Hat',
    skus: {
      'ONE_SIZE': 'APQ-5785473S34A1',
    },
  },
  
  'Phased Motion Tee': {
    productName: 'Phased Motion Tee',
    skus: {
      'cream': {
        'S': 'APQ-5819565S6A1',
        'M': 'APQ-5819565S7A1',
        'L': 'APQ-5819565S8A1',
        'XL': 'APQ-5819565S1A1',
        'XXL': 'APQ-5819565S2A1',
      },
      'white': {
        'S': 'APQ-5819567S6A1',
        'M': 'APQ-5819567S7A1',
        'L': 'APQ-5819567S8A1',
        'XL': 'APQ-5819567S1A1',
        'XXL': 'APQ-5819567S2A1',
      },
      'stone': {
        'S': 'APQ-5823543S6A1',
        'M': 'APQ-5823543S7A1',
        'L': 'APQ-5823543S8A1',
        'XL': 'APQ-5823543S1A1',
        'XXL': 'APQ-5823543S2A1',
      },
    },
  },
};

/**
 * Gets the Apliiq SKU for a given product, size, and color
 * @param {string} productName - Name of the product
 * @param {string} size - Size variant (S, M, L, XL, XXL, ONE_SIZE)
 * @param {string} color - Color variant (e.g., 'cream', 'white')
 * @returns {string|null} Apliiq SKU or null if not found
 */
export function getApliiqSku(productName, size = 'ONE_SIZE', color = null) {
  const mapping = APLIIQ_SKU_MAPPINGS[productName];
  
  if (!mapping) {
    console.error(`No Apliiq SKU mapping found for product: ${productName}`);
    return null;
  }
  
  const normalizedSize = size?.toUpperCase() || 'ONE_SIZE';
  
  // Check if product has color variants
  if (color && mapping.skus[color]) {
    const sku = mapping.skus[color][normalizedSize];
    if (!sku) {
      console.error(`No Apliiq SKU found for product: ${productName}, color: ${color}, size: ${normalizedSize}`);
      return null;
    }
    return sku;
  }
  
  // Fallback to direct size mapping (for products without color variants)
  const sku = mapping.skus[normalizedSize];
  
  if (!sku) {
    console.error(`No Apliiq SKU found for product: ${productName}, size: ${normalizedSize}`);
    return null;
  }
  
  return sku;
}

/**
 * Validates that all line items have valid Apliiq SKUs
 * @param {Array<{productName: string, size?: string, color?: string}>} lineItems
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateLineItems(lineItems) {
  const errors = [];
  
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    errors.push('No line items provided');
    return { valid: false, errors };
  }
  
  lineItems.forEach((item, index) => {
    const { productName, size, color } = item;
    
    if (!productName) {
      errors.push(`Line item ${index + 1}: Missing product name`);
      return;
    }
    
    const sku = getApliiqSku(productName, size, color);
    if (!sku) {
      const colorInfo = color ? `, color: ${color}` : '';
      errors.push(`Line item ${index + 1}: No SKU mapping for ${productName} (size: ${size || 'ONE_SIZE'}${colorInfo})`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}
