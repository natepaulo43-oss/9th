/**
 * Email Integration using Resend
 * Sends transactional emails for order tracking notifications
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
