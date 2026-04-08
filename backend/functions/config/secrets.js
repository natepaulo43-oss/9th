import { defineSecret } from 'firebase-functions/params';

const firebasePrivateKey = defineSecret('SERVICE_ACCOUNT_PRIVATE_KEY');
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const apliiqAppKey = defineSecret('APLIIQ_APP_KEY');
const apliiqSharedSecret = defineSecret('APLIIQ_SHARED_SECRET');

const normalizeFallbacks = (envFallbacks) => {
  if (!envFallbacks) {
    return [];
  }
  return Array.isArray(envFallbacks) ? envFallbacks : [envFallbacks];
};

export const getSecretValue = (secretHandle, envFallbacks) => {
  try {
    const value = secretHandle?.value?.();
    if (value) {
      return value.trim();
    }
  } catch (error) {
    console.warn(
      `Secret lookup failed for ${normalizeFallbacks(envFallbacks).join(', ') || 'unknown secret'}:`,
      error?.message || error
    );
  }

  for (const fallback of normalizeFallbacks(envFallbacks)) {
    if (process.env[fallback]) {
      return process.env[fallback].trim();
    }
  }

  return '';
};

export { firebasePrivateKey, stripeSecretKey, stripeWebhookSecret, apliiqAppKey, apliiqSharedSecret };
