/**
 * Email Integration using Resend
 * Sends transactional emails for order receipts, tracking, and delivery notifications
 * 
 * IMPORTANT: Before emails can be sent from hello@9thform.com, you must:
 * 1. Go to https://resend.com/domains
 * 2. Add and verify 9thform.com via DNS records
 * 3. Add the required TXT, MX, and CNAME records to your DNS provider
 */

import { Resend } from 'resend';
import { config } from './config.js';
import { getTrackingUrl } from './apliiq.js';

let resendClient = null;

/**
 * Gets or initializes the Resend client
 * @returns {Resend}
 */
function getResendClient() {
  if (!resendClient) {
    const { apiKey } = config.resend;
    
    if (!apiKey) {
      throw new Error('Resend API key not configured');
    }
    
    resendClient = new Resend(apiKey);
  }
  
  return resendClient;
}

/**
 * Generates HTML email template for tracking notification
 * @param {Object} params - Email parameters
 * @returns {string} HTML email content
 */
function generateTrackingEmailHtml({
  customerName,
  orderId,
  trackingNumber,
  carrier,
  trackingUrl,
}) {
  const firstName = customerName?.split(' ')[0] || 'there';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order is On Its Way</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">
                9thform
              </h1>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td style="background-color: #111111; border-radius: 12px; padding: 48px 40px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="32" fill="#1a1a1a"/>
                  <path d="M32 20L44 28V44L32 52L20 44V28L32 20Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M28 38L32 42L40 32" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                Your order is on its way
              </h2>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #999999; line-height: 1.6;">
                Hey ${firstName}, your 9thform order has shipped and is heading your way.
              </p>
              
              <!-- Tracking Button -->
              <a href="${trackingUrl}" 
                 style="display: inline-block; background-color: #ffffff; color: #0a0a0a; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: -0.2px;">
                Track Your Package
              </a>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 12px; padding: 32px;">
                <tr>
                  <td style="padding-bottom: 24px; border-bottom: 1px solid #222222;">
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                      Shipping Details
                    </h3>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #999999; width: 40%;">
                          Order ID
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 500;">
                          ${orderId}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #999999;">
                          Tracking Number
                        </td>
                        <td style="padding: 8px 0;">
                          <a href="${trackingUrl}" style="font-size: 14px; color: #ffffff; font-weight: 500; text-decoration: none;">
                            ${trackingNumber}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #999999;">
                          Carrier
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #ffffff; font-weight: 500;">
                          ${carrier}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 0; border-top: 1px solid #222222;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">
                Questions? Email us at 
                <a href="mailto:hello@9thform.com" style="color: #ffffff; text-decoration: none;">
                  hello@9thform.com
                </a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666;">
                <a href="https://9thform.com" style="color: #999999; text-decoration: none;">
                  9thform.com
                </a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of tracking email
 * @param {Object} params - Email parameters
 * @returns {string} Plain text email content
 */
function generateTrackingEmailText({
  customerName,
  orderId,
  trackingNumber,
  carrier,
  trackingUrl,
}) {
  const firstName = customerName?.split(' ')[0] || 'there';
  
  return `
Your order is on its way!

Hey ${firstName}, your 9thform order has shipped and is heading your way.

SHIPPING DETAILS
Order ID: ${orderId}
Tracking Number: ${trackingNumber}
Carrier: ${carrier}

Track your package: ${trackingUrl}

Questions? Email us at hello@9thform.com
Visit us at https://9thform.com

- 9thform
  `.trim();
}

/**
 * Sends a tracking email to the customer
 * @param {Object} params - Email parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.customerEmail - Customer email address
 * @param {string} params.customerName - Customer name
 * @param {string} params.trackingNumber - Tracking number
 * @param {string} params.carrier - Carrier name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendTrackingEmail({
  orderId,
  customerEmail,
  customerName,
  trackingNumber,
  carrier,
}) {
  try {
    console.log('[Email] Sending tracking email:', {
      orderId,
      customerEmail,
      trackingNumber,
      carrier,
    });
    
    if (!customerEmail) {
      throw new Error('Customer email is required');
    }
    
    if (!trackingNumber) {
      throw new Error('Tracking number is required');
    }
    
    // Get tracking URL
    const trackingUrl = getTrackingUrl(carrier, trackingNumber);
    
    // Generate email content
    const htmlContent = generateTrackingEmailHtml({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
      trackingNumber,
      carrier: carrier || 'Carrier',
      trackingUrl,
    });
    
    const textContent = generateTrackingEmailText({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
      trackingNumber,
      carrier: carrier || 'Carrier',
      trackingUrl,
    });
    
    // Send email via Resend
    const resend = getResendClient();
    const { fromEmail, fromName } = config.resend;
    
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customerEmail,
      subject: 'Your 9thform order is on its way! 📦',
      html: htmlContent,
      text: textContent,
    });
    
    if (error) {
      throw new Error(error.message || 'Resend API returned an error');
    }
    
    console.log('[Email] Tracking email sent successfully:', {
      orderId,
      messageId: data?.id,
    });
    
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Failed to send tracking email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Sends a test email (for debugging)
 * @param {string} toEmail - Email address to send test to
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendTestEmail(toEmail) {
  return sendTrackingEmail({
    orderId: 'TEST-12345',
    customerEmail: toEmail,
    customerName: 'Test Customer',
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
  });
}

/**
 * Formats a price in cents to a display string
 * @param {number} cents - Price in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
function formatPrice(cents, currency = 'usd') {
  const dollars = (cents / 100).toFixed(2);
  if (currency === 'usd') return `$${dollars}`;
  return `${dollars} ${currency.toUpperCase()}`;
}

/**
 * Builds a variant description string from size and color
 * @param {Object} item - Cart line item
 * @returns {string} e.g. "White / L" or "L" or "White" or ""
 */
function formatVariant(item) {
  const parts = [];
  if (item.color) parts.push(item.color.charAt(0).toUpperCase() + item.color.slice(1));
  if (item.size && item.size !== 'ONE_SIZE') parts.push(item.size);
  return parts.join(' / ');
}

/**
 * Generates HTML email template for order receipt
 * @param {Object} params - Email parameters
 * @returns {string} HTML email content
 */
function generateReceiptEmailHtml({
  customerName,
  orderId,
  items,
  amountSubtotal,
  amountTotal,
  currency,
  shippingAddress,
  shippingName,
}) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const itemRowsHtml = (items || []).map((item) => {
    const name = item.productName || item.product?.name || 'Item';
    const variant = formatVariant(item);
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;
    return `
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #222222;">
                          <p style="margin: 0 0 4px 0; font-size: 14px; color: #ffffff; font-weight: 500;">
                            ${name}
                          </p>
                          ${variant ? `<p style="margin: 0; font-size: 13px; color: #999999;">${variant}</p>` : ''}
                        </td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #222222; text-align: center; font-size: 14px; color: #999999;">
                          ${qty}
                        </td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #222222; text-align: right; font-size: 14px; color: #ffffff; font-weight: 500;">
                          ${formatPrice(lineTotal, currency)}
                        </td>
                      </tr>`;
  }).join('');

  const shippingCost = (amountTotal || 0) - (amountSubtotal || 0);

  const addr = shippingAddress || {};
  const addrLines = [
    shippingName || '',
    addr.line1 || '',
    addr.line2 || '',
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
    addr.country || '',
  ].filter(Boolean);
  const addressHtml = addrLines.map((l) => `<span>${l}</span>`).join('<br/>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">
                9thform
              </h1>
            </td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="background-color: #111111; border-radius: 12px; padding: 48px 40px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                Thanks for your order
              </h2>
              <p style="margin: 0; font-size: 16px; color: #999999; line-height: 1.6;">
                Hey ${firstName}, we have received your order and it is being prepared. We will email you again once it ships.
              </p>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 12px; padding: 32px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                      Order ${orderId}
                    </h3>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <!-- Column headers -->
                      <tr>
                        <td style="padding: 0 0 12px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #222222;">
                          Item
                        </td>
                        <td style="padding: 0 0 12px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; border-bottom: 1px solid #222222;">
                          Qty
                        </td>
                        <td style="padding: 0 0 12px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; border-bottom: 1px solid #222222;">
                          Price
                        </td>
                      </tr>
                      ${itemRowsHtml}
                    </table>

                    <!-- Totals -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #999999;">Subtotal</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #ffffff; text-align: right;">${formatPrice(amountSubtotal, currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #999999;">Shipping &amp; Tax</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #ffffff; text-align: right;">${formatPrice(shippingCost, currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0 0 0; font-size: 16px; color: #ffffff; font-weight: 700; border-top: 1px solid #222222;">Total</td>
                        <td style="padding: 12px 0 0 0; font-size: 16px; color: #ffffff; font-weight: 700; text-align: right; border-top: 1px solid #222222;">${formatPrice(amountTotal, currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 12px; padding: 32px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                      Shipping To
                    </h3>
                    <p style="margin: 0; font-size: 14px; color: #999999; line-height: 1.8;">
                      ${addressHtml}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 0; border-top: 1px solid #222222;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">
                Questions? Email us at
                <a href="mailto:hello@9thform.com" style="color: #ffffff; text-decoration: none;">
                  hello@9thform.com
                </a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666;">
                <a href="https://9thform.com" style="color: #999999; text-decoration: none;">
                  9thform.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of order receipt email
 * @param {Object} params - Email parameters
 * @returns {string} Plain text email content
 */
function generateReceiptEmailText({
  customerName,
  orderId,
  items,
  amountSubtotal,
  amountTotal,
  currency,
  shippingAddress,
  shippingName,
}) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const itemLines = (items || []).map((item) => {
    const name = item.productName || item.product?.name || 'Item';
    const variant = formatVariant(item);
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;
    const variantStr = variant ? ` (${variant})` : '';
    return `  ${name}${variantStr} x${qty} — ${formatPrice(lineTotal, currency)}`;
  }).join('\n');

  const shippingCost = (amountTotal || 0) - (amountSubtotal || 0);

  const addr = shippingAddress || {};
  const addrLines = [
    shippingName || '',
    addr.line1 || '',
    addr.line2 || '',
    [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
    addr.country || '',
  ].filter(Boolean).join('\n  ');

  return `
Thanks for your order!

Hey ${firstName}, we have received your order and it is being prepared. We will email you again once it ships.

ORDER ${orderId}
${itemLines}

Subtotal: ${formatPrice(amountSubtotal, currency)}
Shipping & Tax: ${formatPrice(shippingCost, currency)}
Total: ${formatPrice(amountTotal, currency)}

SHIPPING TO
  ${addrLines}

Questions? Email us at hello@9thform.com
Visit us at https://9thform.com

- 9thform
  `.trim();
}

/**
 * Sends an order receipt email to the customer
 * @param {Object} params - Email parameters
 * @param {string} params.orderId - Firestore order ID
 * @param {string} params.customerEmail - Customer email address
 * @param {string} params.customerName - Customer name
 * @param {Array}  params.items - Cart line items (each with productName, size, color, quantity, price)
 * @param {number} params.amountSubtotal - Subtotal in cents
 * @param {number} params.amountTotal - Total in cents (includes shipping & tax)
 * @param {string} params.currency - Currency code (e.g. 'usd')
 * @param {Object} params.shippingAddress - Shipping address object
 * @param {string} params.shippingName - Recipient name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendReceiptEmail({
  orderId,
  customerEmail,
  customerName,
  items,
  amountSubtotal,
  amountTotal,
  currency,
  shippingAddress,
  shippingName,
}) {
  try {
    console.log('[Email] Sending receipt email:', {
      orderId,
      customerEmail,
      itemCount: items?.length,
    });

    if (!customerEmail) {
      throw new Error('Customer email is required');
    }

    const htmlContent = generateReceiptEmailHtml({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
      items: items || [],
      amountSubtotal: amountSubtotal || 0,
      amountTotal: amountTotal || 0,
      currency: currency || 'usd',
      shippingAddress,
      shippingName: shippingName || customerName || '',
    });

    const textContent = generateReceiptEmailText({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
      items: items || [],
      amountSubtotal: amountSubtotal || 0,
      amountTotal: amountTotal || 0,
      currency: currency || 'usd',
      shippingAddress,
      shippingName: shippingName || customerName || '',
    });

    const resend = getResendClient();
    const { fromEmail, fromName } = config.resend;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customerEmail,
      subject: `Order confirmed — thanks for shopping with 9thform!`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      throw new Error(error.message || 'Resend API returned an error');
    }

    console.log('[Email] Receipt email sent successfully:', {
      orderId,
      messageId: data?.id,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Failed to send receipt email:', error);

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Generates HTML email template for delivery confirmation
 * @param {Object} params - Email parameters
 * @returns {string} HTML email content
 */
function generateDeliveryEmailHtml({ customerName, orderId }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">
                9thform
              </h1>
            </td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="background-color: #111111; border-radius: 12px; padding: 48px 40px; text-align: center;">
              <div style="margin-bottom: 24px;">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="32" fill="#1a1a1a"/>
                  <path d="M24 32L30 38L40 26" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                Your order has arrived
              </h2>

              <p style="margin: 0 0 12px 0; font-size: 16px; color: #999999; line-height: 1.6;">
                Hey ${firstName}, your 9thform order <strong style="color: #ffffff;">${orderId}</strong> has been delivered.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 16px; color: #999999; line-height: 1.6;">
                Thank you for supporting 9thform. We hope you love it.
              </p>

              <!-- Shop Again Button -->
              <a href="https://9thform.com"
                 style="display: inline-block; background-color: #ffffff; color: #0a0a0a; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: -0.2px;">
                Shop New Drops
              </a>
            </td>
          </tr>

          <!-- Message Section -->
          <tr>
            <td style="padding: 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 12px; padding: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #ffffff; font-weight: 600;">
                      Something not right?
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #999999; line-height: 1.6;">
                      If anything is wrong with your order, just reply to this email or reach out at
                      <a href="mailto:hello@9thform.com" style="color: #ffffff; text-decoration: none;">hello@9thform.com</a>
                      and we will make it right.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 0; border-top: 1px solid #222222;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">
                Questions? Email us at
                <a href="mailto:hello@9thform.com" style="color: #ffffff; text-decoration: none;">
                  hello@9thform.com
                </a>
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666;">
                <a href="https://9thform.com" style="color: #999999; text-decoration: none;">
                  9thform.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of delivery confirmation email
 * @param {Object} params - Email parameters
 * @returns {string} Plain text email content
 */
function generateDeliveryEmailText({ customerName, orderId }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  return `
Your order has arrived!

Hey ${firstName}, your 9thform order ${orderId} has been delivered.

Thank you for supporting 9thform. We hope you love it.

Something not right? Just reply to this email or reach out at hello@9thform.com and we will make it right.

Shop new drops: https://9thform.com

- 9thform
  `.trim();
}

/**
 * Sends a delivery confirmation / thank-you email to the customer
 * @param {Object} params - Email parameters
 * @param {string} params.orderId - Order ID
 * @param {string} params.customerEmail - Customer email address
 * @param {string} params.customerName - Customer name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendDeliveryEmail({
  orderId,
  customerEmail,
  customerName,
}) {
  try {
    console.log('[Email] Sending delivery confirmation email:', {
      orderId,
      customerEmail,
    });

    if (!customerEmail) {
      throw new Error('Customer email is required');
    }

    const htmlContent = generateDeliveryEmailHtml({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
    });

    const textContent = generateDeliveryEmailText({
      customerName: customerName || 'Customer',
      orderId: orderId || 'N/A',
    });

    const resend = getResendClient();
    const { fromEmail, fromName } = config.resend;

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: customerEmail,
      subject: 'Your 9thform order has been delivered!',
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      throw new Error(error.message || 'Resend API returned an error');
    }

    console.log('[Email] Delivery confirmation email sent successfully:', {
      orderId,
      messageId: data?.id,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Failed to send delivery confirmation email:', error);

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}
