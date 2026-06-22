import express from 'express';

import Stripe from 'stripe';

import { createOrder } from '../services/orderService.js';

import { strictRateLimiter } from '../middleware/rateLimiter.js';

import { validateCheckoutSession } from '../middleware/validation.js';

import { db } from '../config/firebase.js';

import { submitOrderToApliiq } from '../lib/apliiq.js';

import { sendReceiptEmail } from '../lib/email.js';



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

  [

    'prod_UFcE8PRgn7qBzR',

    {

      name: 'Phased Motion Tee',

      price: 3199,

      currency: 'usd',

      image: '/images/shirt mockup.jpg',

    },

  ],

  [

    'prod_UeP9MPCNPrdlxF',

    {

      name: 'The Glide Tee',

      price: 3199,

      currency: 'usd',

      image: '/images/images/longboarders mockup.jpg',

    },

  ],

  [

    'prod_UklokvriH3B3yz',

    {

      name: 'Triple Cord Cap',

      price: 3499,

      currency: 'usd',

      image: '/images/5808643_6043-2026-06-08-22-44-48-401.png',

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

  const pathParts = normalizedPath.split('/');

  const encodedPath = pathParts.map((part, index) => 

    index === pathParts.length - 1 ? encodeURIComponent(part) : part

  ).join('/');

  return `${normalizedBase}${encodedPath}`;

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

  router.post('/create-checkout-session', strictRateLimiter, validateCheckoutSession, async (req, res) => {

    try {

      if (!stripe) {

        throw new Error('Stripe is not configured.');

      }

      const { items = [], successUrl, cancelUrl, discountCode } = req.body || {};

      console.log('Checkout request received:', { items, itemCount: items.length });



      if (!Array.isArray(items) || items.length === 0) {

        return res.status(400).json({ error: 'Cart items are required.' });

      }



      const sanitizedItems = items.map((item) => {

        const productId = String(item.productId ?? '');

        const catalogEntry = productCatalog.get(productId);

        console.log(`Processing product: ${productId}`, { found: !!catalogEntry, catalogEntry });



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

          size: item.size || undefined,

          color: item.color || undefined,

          product: catalogEntry,

        };

      });

      

      const lineItems = sanitizedItems.map(({ product, quantity }) => ({

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

      }));

      

      console.log('Creating Stripe session with line items:', JSON.stringify(lineItems, null, 2));



      const session = await stripe.checkout.sessions.create({

        mode: 'payment',

        payment_method_types: ['card'],

        line_items: lineItems,

        shipping_address_collection: { allowed_countries: ['US', 'CA'] },

        shipping_options: [

          {

            shipping_rate: 'shr_1TKsRVGxmarJfmGo8H92gMWE',

          },

        ],

        phone_number_collection: { enabled: true },

        success_url: successUrl || `${frontendUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: cancelUrl || `${frontendUrl}/shop?status=cancelled`,

        metadata: {

          cart: JSON.stringify(

            sanitizedItems.map(({ productId, quantity, size, color, product }) => ({ 
              productId, 
              quantity,
              size,
              color,
              productName: product.name,
              price: product.price
            }))

          ),

        },

        automatic_tax: { enabled: true },

        allow_promotion_codes: true,

      });

      

      console.log('Stripe session created successfully:', session.id);



      res.json({ sessionId: session.id, url: session.url });

    } catch (error) {

      console.error('Stripe checkout error:', {

        message: error.message,

        type: error.type,

        code: error.code,

        statusCode: error.statusCode,

        raw: error.raw,

        stack: error.stack

      });

      res.status(500).json({ error: error.message });

    }

  });



  // Endpoint to verify session and create order (fallback for when webhook doesn't trigger)

  router.post('/verify-session', strictRateLimiter, async (req, res) => {

    try {

      if (!stripe) {

        throw new Error('Stripe is not configured.');

      }



      const { sessionId } = req.body;

      if (!sessionId) {

        return res.status(400).json({ error: 'Session ID is required' });

      }



      // Retrieve the session from Stripe

      const session = await stripe.checkout.sessions.retrieve(sessionId, {

        expand: ['payment_intent.latest_charge']

      });



      // Check if payment was successful

      if (session.payment_status !== 'paid') {

        return res.status(400).json({ error: 'Payment not completed' });

      }



      // Check if order already exists for this session

      const existingOrders = await db.collection('orders')

        .where('stripeSessionId', '==', session.id)

        .limit(1)

        .get();



      if (!existingOrders.empty) {

        return res.json({ 

          success: true, 

          message: 'Order already exists',

          orderId: existingOrders.docs[0].id 

        });

      }



      // Extract billing address from payment intent

      let billingAddress = {};

      if (session.payment_intent?.latest_charge?.billing_details?.address) {

        billingAddress = session.payment_intent.latest_charge.billing_details.address;

      }



      // Create the order

      const orderData = {

        stripeSessionId: session.id,

        stripePaymentIntentId: session.payment_intent?.id || session.payment_intent,

        customerEmail: session.customer_details?.email || '',

        customerName: session.customer_details?.name || '',

        customerPhone: session.customer_details?.phone || '',

        shippingAddress: session.shipping_details?.address || {},

        shippingName: session.shipping_details?.name || session.customer_details?.name || '',

        billingAddress: billingAddress,

        amountTotal: session.amount_total,

        amountSubtotal: session.amount_subtotal,

        currency: session.currency,

        items: JSON.parse(session.metadata?.cart || '[]'),

        paymentStatus: session.payment_status,

      };



      const result = await createOrder(orderData);

      if (result.success) {

        console.log('Order created via verify-session:', result.data.id);

        // Submit to Apliiq for fulfillment (same as webhook path)
        try {

          const orderDoc = await db.collection('orders').doc(result.data.id).get();

          if (orderDoc.exists) {

            const fullOrder = { id: orderDoc.id, ...orderDoc.data() };

            console.log('Submitting order to Apliiq (via verify-session):', fullOrder.id);

            const apliiqResult = await submitOrderToApliiq(fullOrder);

            if (apliiqResult.success) {

              await db.collection('orders').doc(result.data.id).update({

                apliiqOrderId: apliiqResult.apliiqOrderId,

                apliiqNumericId: apliiqResult.numericId,

                status: 'submitted_to_supplier',

                apliqStatus: 'submitted',

                submittedToApliiqAt: new Date(),

              });

              console.log('Order submitted to Apliiq via verify-session:', {

                orderId: result.data.id,

                apliiqOrderId: apliiqResult.apliiqOrderId,

              });

            } else {

              console.error('Failed to submit order to Apliiq (via verify-session):', apliiqResult.error);

              await db.collection('orders').doc(result.data.id).update({

                apliiqSubmissionError: apliiqResult.error,

                apliqStatus: 'submission_failed',

              });

            }

          }

        } catch (apliiqError) {

          console.error('Error during Apliiq submission (via verify-session):', apliiqError);

          try {

            await db.collection('orders').doc(result.data.id).update({

              apliiqSubmissionError: apliiqError.message,

              apliqStatus: 'submission_failed',

            });

          } catch (updateError) {

            console.error('Failed to update order with error status:', updateError);

          }

        }

        // Send order receipt email to the customer (verify-session path)
        try {
          const receiptResult = await sendReceiptEmail({
            orderId: result.data.id,
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            items: orderData.items,
            amountSubtotal: orderData.amountSubtotal,
            amountTotal: orderData.amountTotal,
            currency: orderData.currency,
            shippingAddress: orderData.shippingAddress,
            shippingName: orderData.shippingName,
          });

          if (receiptResult.success) {
            await db.collection('orders').doc(result.data.id).update({
              receiptEmailSent: true,
              receiptEmailSentAt: new Date(),
            });
            console.log('Receipt email sent (via verify-session):', result.data.id);
          } else {
            console.error('Failed to send receipt email (via verify-session):', receiptResult.error);
          }
        } catch (emailError) {
          console.error('Error sending receipt email (via verify-session):', emailError);
        }

        return res.json({ success: true, orderId: result.data.id });

      } else {

        console.error('Failed to create order:', result.error);

        return res.status(500).json({ error: result.error });

      }

    } catch (error) {

      console.error('Error verifying session:', error);

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



        // Save order to Firestore

        try {

          // Retrieve full session with payment intent details to get billing address

          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {

            expand: ['payment_intent.latest_charge']

          });



          // Extract billing address from payment intent

          let billingAddress = {};

          if (fullSession.payment_intent?.latest_charge?.billing_details?.address) {

            billingAddress = fullSession.payment_intent.latest_charge.billing_details.address;

          }



          const orderData = {

            stripeSessionId: fullSession.id,

            stripePaymentIntentId: fullSession.payment_intent?.id || fullSession.payment_intent,

            customerEmail: fullSession.customer_details?.email || '',

            customerName: fullSession.customer_details?.name || '',

            customerPhone: fullSession.customer_details?.phone || '',

            shippingAddress: fullSession.shipping_details?.address || {},

            shippingName: fullSession.shipping_details?.name || fullSession.customer_details?.name || '',

            billingAddress: billingAddress,

            amountTotal: fullSession.amount_total,

            amountSubtotal: fullSession.amount_subtotal,

            currency: fullSession.currency,

            items: JSON.parse(fullSession.metadata?.cart || '[]'),

            paymentStatus: fullSession.payment_status,

          };



          const result = await createOrder(orderData);

          if (result.success) {

            console.log('Order saved to Firestore:', result.data.id);

            

            // Automatically submit order to Apliiq for fulfillment

            try {

              // Fetch the full order document to get all details including the ID

              const orderDoc = await db.collection('orders').doc(result.data.id).get();

              

              if (orderDoc.exists) {

                const fullOrder = { id: orderDoc.id, ...orderDoc.data() };

                

                console.log('Submitting order to Apliiq:', fullOrder.id);

                const apliiqResult = await submitOrderToApliiq(fullOrder);

                

                if (apliiqResult.success) {

                  // Update order with Apliiq order ID and status

                  await db.collection('orders').doc(result.data.id).update({

                    apliiqOrderId: apliiqResult.apliiqOrderId,

                    apliiqNumericId: apliiqResult.numericId,

                    status: 'submitted_to_supplier',

                    apliqStatus: 'submitted',

                    submittedToApliiqAt: new Date(),

                  });

                  

                  console.log('Order submitted to Apliiq successfully:', {

                    orderId: result.data.id,

                    apliiqOrderId: apliiqResult.apliiqOrderId,

                  });

                } else {

                  console.error('Failed to submit order to Apliiq:', apliiqResult.error);

                  

                  // Update order to indicate submission failed

                  await db.collection('orders').doc(result.data.id).update({

                    apliiqSubmissionError: apliiqResult.error,

                    apliqStatus: 'submission_failed',

                  });

                }

              }

            } catch (apliiqError) {

              console.error('Error during Apliiq submission:', apliiqError);

              

              // Don't fail the webhook - order is still saved

              try {

                await db.collection('orders').doc(result.data.id).update({

                  apliiqSubmissionError: apliiqError.message,

                  apliqStatus: 'submission_failed',

                });

              } catch (updateError) {

                console.error('Failed to update order with error status:', updateError);

              }

            }

            // Send order receipt email to the customer
            try {
              const receiptResult = await sendReceiptEmail({
                orderId: result.data.id,
                customerEmail: orderData.customerEmail,
                customerName: orderData.customerName,
                items: orderData.items,
                amountSubtotal: orderData.amountSubtotal,
                amountTotal: orderData.amountTotal,
                currency: orderData.currency,
                shippingAddress: orderData.shippingAddress,
                shippingName: orderData.shippingName,
              });

              if (receiptResult.success) {
                await db.collection('orders').doc(result.data.id).update({
                  receiptEmailSent: true,
                  receiptEmailSentAt: new Date(),
                });
                console.log('Receipt email sent successfully:', result.data.id);
              } else {
                console.error('Failed to send receipt email:', receiptResult.error);
              }
            } catch (emailError) {
              console.error('Error sending receipt email:', emailError);
            }

          } else {

            console.error('Failed to save order to Firestore:', result.error);

          }

        } catch (error) {

          console.error('Error processing order:', error);

        }

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

