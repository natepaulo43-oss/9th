/**
 * Centralized configuration for environment variables
 * Validates required variables at startup and provides typed access
 */

import { getSecretValue, apliiqAppKey, apliiqSharedSecret } from '../config/secrets.js';

/**
 * Gets an environment variable and throws if missing
 * @param {string} key - Environment variable name
 * @param {boolean} required - Whether this variable is required
 * @returns {string}
 */
function getEnvVar(key, required = true) {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

/**
 * Application configuration object
 * All environment variables are accessed through this centralized config
 */
export const config = {
  // Apliiq API Configuration
  apliiq: {
    appKey: getSecretValue(apliiqAppKey),
    sharedSecret: getSecretValue(apliiqSharedSecret),
    baseUrl: getEnvVar('APLIIQ_BASE_URL', false) || 'https://api.apliiq.com',
    store: '9thform',
  },
  
  // Resend Email Configuration
  resend: {
    apiKey: getEnvVar('RESEND_API_KEY', false),
    fromEmail: getEnvVar('RESEND_FROM_EMAIL', false) || 'hello@9thform.com',
    fromName: 'thform',
  },
  
  // Site Configuration
  site: {
    url: getEnvVar('NEXT_PUBLIC_SITE_URL', false) || 'https://9thform.com',
  },
  
  // Firebase Configuration (already handled by existing config)
  firebase: {
    projectId: getEnvVar('FIREBASE_PROJECT_ID', false),
  },
  
  // Stripe Configuration (already handled by existing config)
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY', false),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', false),
  },
};

/**
 * Validates that all required configuration is present
 * Call this at application startup
 */
export function validateConfig() {
  const warnings = [];
  
  if (!config.apliiq.appKey) {
    warnings.push('APLIIQ_APP_KEY is not set - Apliiq integration will not work');
  }
  
  if (!config.apliiq.sharedSecret) {
    warnings.push('APLIIQ_SHARED_SECRET is not set - Apliiq integration will not work');
  }
  
  if (!config.resend.apiKey) {
    warnings.push('RESEND_API_KEY is not set - Email notifications will not work');
  }
  
  if (warnings.length > 0) {
    console.warn('Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  return warnings.length === 0;
}
