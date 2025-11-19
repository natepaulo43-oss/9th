import { defineSecret } from 'firebase-functions/params';

const firebasePrivateKey = defineSecret('SERVICE_ACCOUNT_PRIVATE_KEY');
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

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
      return value;
    }
  } catch (error) {
    console.warn(
      `Secret lookup failed for ${normalizeFallbacks(envFallbacks).join(', ') || 'unknown secret'}:`,
      error?.message || error
    );
  }

  for (const fallback of normalizeFallbacks(envFallbacks)) {
    if (process.env[fallback]) {
      return process.env[fallback];
    }
  }

  return '';
};

export { firebasePrivateKey, stripeSecretKey, stripeWebhookSecret };
