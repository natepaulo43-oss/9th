/**
 * Utility: list recent orders and send missing delivery/tracking emails
 * via the deployed admin API (no local RESEND_API_KEY needed).
 *
 * Usage:
 *   node scripts/send-delivery-email.mjs                        -- list recent 20 orders
 *   node scripts/send-delivery-email.mjs --name "sweeney"       -- find by name, print send command
 *   node scripts/send-delivery-email.mjs --send <orderId> delivery  -- send delivery email
 *   node scripts/send-delivery-email.mjs --send <orderId> tracking  -- send tracking email
 *   node scripts/send-delivery-email.mjs --send <orderId> all       -- send both
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '../../.env'), override: false });
dotenv.config({ path: join(__dirname, '../.env'), override: false });

const API_BASE = 'https://api-lh3ld5zqcq-uc.a.run.app';
const AUTH_TOKEN = process.env.STRIPE_WEBHOOK_SECRET;

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore(app);

async function listOrders(searchName = null) {
  const snap = await db.collection('orders').orderBy('createdAt', 'desc').limit(20).get();
  let orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (searchName) {
    orders = orders.filter(o =>
      o.customerName?.toLowerCase().includes(searchName) ||
      o.customerEmail?.toLowerCase().includes(searchName)
    );
  }
  return orders;
}

async function sendViaAdminApi(orderId, types) {
  const body = JSON.stringify({ orderId, types });
  const res = await fetch(`${API_BASE}/orders/admin/resend-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    body,
  });
  return res.json();
}

const args = process.argv.slice(2);
const nameFlag = args.indexOf('--name');
const searchName = nameFlag !== -1 ? args[nameFlag + 1]?.toLowerCase() : null;
const sendFlag = args.indexOf('--send');
const sendOrderId = sendFlag !== -1 ? args[sendFlag + 1] : null;
const sendType = sendFlag !== -1 ? args[sendFlag + 2] : null;

async function main() {
  if (sendOrderId) {
    const types = sendType === 'all' ? ['tracking', 'delivery'] : [sendType || 'delivery'];
    console.log(`\nSending [${types.join(', ')}] email(s) for order: ${sendOrderId}`);
    const result = await sendViaAdminApi(sendOrderId, types);
    console.log('Result:', JSON.stringify(result, null, 2));
    return;
  }

  const orders = await listOrders(searchName);

  if (orders.length === 0) {
    console.log(searchName ? `No orders found matching "${searchName}"` : 'No recent orders found.');
    return;
  }

  console.log(`\n=== ${searchName ? `Orders matching "${searchName}"` : 'Recent 20 Orders'} ===`);
  orders.forEach((o, i) => {
    const date = o.createdAt?.toDate?.()?.toLocaleDateString() || 'unknown';
    console.log(
      `${i + 1}. [${date}] ${o.customerName || 'Unknown'} <${o.customerEmail}> ` +
      `| status: ${o.status} | trackingEmailSent: ${o.emailSent || false} ` +
      `| deliveryEmailSent: ${o.deliveryEmailSent || false} | id: ${o.id}`
    );
  });

  console.log('\n--- Send commands ---');
  orders.forEach(o => {
    if (!o.deliveryEmailSent) {
      console.log(`node scripts/send-delivery-email.mjs --send ${o.id} delivery   # ${o.customerName}`);
    }
  });
}

main().catch(e => { console.error(e); process.exit(1); });
