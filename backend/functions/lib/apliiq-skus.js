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
      'S': 'APQ-5819565S6A1',
      'M': 'APQ-5819565S7A1',
      'L': 'APQ-5819565S8A1',
      'XL': 'APQ-5819565S1A1',
      'XXL': 'APQ-5819565S2A1',
    },
  },
};

/**
 * Gets the Apliiq SKU for a given product and size
 * @param {string} productName - Name of the product
 * @param {string} size - Size variant (S, M, L, XL, XXL, ONE_SIZE)
 * @returns {string|null} Apliiq SKU or null if not found
 */
export function getApliiqSku(productName, size = 'ONE_SIZE') {
  const mapping = APLIIQ_SKU_MAPPINGS[productName];
  
  if (!mapping) {
    console.error(`No Apliiq SKU mapping found for product: ${productName}`);
    return null;
  }
  
  const normalizedSize = size?.toUpperCase() || 'ONE_SIZE';
  const sku = mapping.skus[normalizedSize];
  
  if (!sku) {
    console.error(`No Apliiq SKU found for product: ${productName}, size: ${normalizedSize}`);
    return null;
  }
  
  return sku;
}

/**
 * Validates that all line items have valid Apliiq SKUs
 * @param {Array<{productName: string, size?: string}>} lineItems
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateLineItems(lineItems) {
  const errors = [];
  
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    errors.push('No line items provided');
    return { valid: false, errors };
  }
  
  lineItems.forEach((item, index) => {
    const { productName, size } = item;
    
    if (!productName) {
      errors.push(`Line item ${index + 1}: Missing product name`);
      return;
    }
    
    const sku = getApliiqSku(productName, size);
    if (!sku) {
      errors.push(`Line item ${index + 1}: No SKU mapping for ${productName} (size: ${size || 'ONE_SIZE'})`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
