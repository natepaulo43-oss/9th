import express from 'express';
import Stripe from 'stripe';

const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DEFAULT_ASSET_BASE_URL = process.env.ASSET_BASE_URL || DEFAULT_FRONTEND_URL;

const productCatalog = new Map([
  [
    'prod_TRRTgFMRWW7OZS',
    {
      name: 'Canvas 9thform Skate Hat',
      price: 3499,
      currency: 'usd',
      image: '/images/skatecap.PNG',
    },
  ],
  [
    'prod_TRRUrKA3MQ9fay',
    {
      name: 'Canvas 9thform Falling Guy Hat',
      price: 3499,
      currency: 'usd',
      image: '/images/aspect_white.png',
    },
  ],
]);

const toAbsoluteImageUrl = (imagePath, baseUrl = DEFAULT_ASSET_BASE_URL) => {
  if (!imagePath) return undefined;
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${normalizedBase}${normalizedPath}`;
};

const createStripeRouter = ({
  stripeSecretKey,
  stripeWebhookSecret,
  frontendUrl = DEFAULT_FRONTEND_URL,
  assetBaseUrl = DEFAULT_ASSET_BASE_URL,
} = {}) => {
  const router = express.Router();
  const normalizedAssetBaseUrl = assetBaseUrl || frontendUrl;
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

  // Create checkout session
  router.post('/create-checkout-session', async (req, res) => {
    try {
      if (!stripe) {
        throw new Error('Stripe is not configured.');
      }
      const { items = [], successUrl, cancelUrl, discountCode } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart items are required.' });
      }

      const sanitizedItems = items.map((item) => {
        const productId = String(item.productId ?? '');
        const catalogEntry = productCatalog.get(productId);

        if (!catalogEntry) {
          throw new Error(`Invalid product: ${productId}`);
        }

        const quantity = Number.parseInt(item.quantity, 10);
        if (!Number.isFinite(quantity) || quantity < 1) {
          throw new Error(`Invalid quantity for product ${productId}`);
        }

        return {
          productId,
          quantity,
          product: catalogEntry,
        };
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: sanitizedItems.map(({ product, quantity }) => ({
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              images: product.image
                ? [toAbsoluteImageUrl(product.image, normalizedAssetBaseUrl)]
                : undefined,
            },
            unit_amount: product.price,
          },
          quantity,
        })),
        shipping_address_collection: { allowed_countries: ['US', 'CA'] },
        phone_number_collection: { enabled: true },
        success_url: successUrl || `${frontendUrl}/thank-you`,
        cancel_url: cancelUrl || `${frontendUrl}/shop?status=cancelled`,
        metadata: {
          cart: JSON.stringify(
            sanitizedItems.map(({ productId, quantity }) => ({ productId, quantity }))
          ),
        },
        automatic_tax: { enabled: true },
        allow_promotion_codes: true,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook to handle successful payments
  router.post('/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured.' });
    }
    if (!stripeWebhookSecret) {
      return res.status(500).json({ error: 'Stripe webhook secret is not configured.' });
    }

    const sig = req.headers['stripe-signature'];
    const rawBody = req.rawBody;

    if (!rawBody) {
      console.error('Missing raw request body for Stripe webhook verification.');
      return res.status(400).send('Missing raw body for Stripe webhook verification.');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Payment successful:', session.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  return router;
};

export default createStripeRouter;
