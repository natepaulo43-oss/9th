/**
 * One-time script: find recent orders missing tracking emails, fetch tracking from Apliiq, update Firestore, send emails.
 * Run: node scripts/fix-tracking-emails.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const PROJECT_ID = 'thform-33f71';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Load secrets from Firebase config
const configPath = 'C:/Users/Nate/.config/configstore/firebase-tools.json';
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ACCESS_TOKEN = firebaseConfig.tokens?.access_token;

if (!ACCESS_TOKEN) {
  console.error('No Firebase access token found. Run: firebase login');
  process.exit(1);
}

// --- HTTP helper ---
function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        ...headers,
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// --- Firestore helpers ---
function fsVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  return { stringValue: String(v) };
}

function fromFsVal(fv) {
  if (!fv) return null;
  if ('stringValue' in fv) return fv.stringValue;
  if ('integerValue' in fv) return parseInt(fv.integerValue, 10);
  if ('doubleValue' in fv) return fv.doubleValue;
  if ('booleanValue' in fv) return fv.booleanValue;
  if ('timestampValue' in fv) return fv.timestampValue;
  if ('nullValue' in fv) return null;
  return null;
}

function fromFsDoc(doc) {
  if (!doc?.fields) return null;
  const obj = { _id: doc.name?.split('/').pop() };
  for (const [k, v] of Object.entries(doc.fields)) {
    obj[k] = fromFsVal(v);
  }
  return obj;
}

async function queryOrders() {
  const res = await request('POST', `${FIRESTORE_BASE}:runQuery`, {
    structuredQuery: {
      from: [{ collectionId: 'orders' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'apliqStatus' },
                op: 'IN',
                value: { arrayValue: { values: [{ stringValue: 'submitted' }, { stringValue: 'submitted_to_supplier' }] } },
              },
            },
          ],
        },
      },
      limit: 30,
    },
  });

  if (res.status !== 200) {
    throw new Error(`Firestore query failed: ${JSON.stringify(res.body)}`);
  }

  return (res.body || []).map(r => fromFsDoc(r.document)).filter(Boolean);
}

async function patchOrder(orderId, fields) {
  const firestoreFields = {};
  for (const [k, v] of Object.entries(fields)) {
    firestoreFields[k] = fsVal(v);
  }
  const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await request(
    'PATCH',
    `${FIRESTORE_BASE}/orders/${orderId}?${updateMask}`,
    { fields: firestoreFields }
  );
  if (res.status !== 200) {
    throw new Error(`Firestore patch failed for ${orderId}: ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

// --- Apliiq helpers ---
function toNumericOrderId(strId) {
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = (hash * 31 + strId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function getApliiqSecrets() {
  // Fetch secrets from Firebase Secret Manager using the CLI token
  async function fetchSecret(name) {
    const res = await request('GET', `https://secretmanager.googleapis.com/v1/projects/${PROJECT_ID}/secrets/${name}/versions/latest:access`);
    if (res.status !== 200) return null;
    return Buffer.from(res.body.payload?.data, 'base64').toString('utf8').trim();
  }
  const appKey = await fetchSecret('APLIIQ_APP_KEY');
  const sharedSecret = await fetchSecret('APLIIQ_SHARED_SECRET');
  const resendApiKey = await fetchSecret('RESEND_API_KEY');
  return { appKey, sharedSecret, resendApiKey };
}

function buildApliiqAuth(appKey, sharedSecret, payload = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payloadStr = Object.keys(payload).length > 0 ? JSON.stringify(payload) : '';
  const base64Content = Buffer.from(payloadStr).toString('base64');
  const stringToSign = `${appKey}${timestamp}${nonce}${base64Content}`;
  const hmac = crypto.createHmac('sha256', sharedSecret);
  hmac.update(stringToSign);
  const signature = hmac.digest('base64');
  return `x-apliiq-auth ${timestamp}:${signature}:${appKey}:${nonce}`;
}

async function getApliiqTracking(lookupId, appKey, sharedSecret) {
  const auth = buildApliiqAuth(appKey, sharedSecret, {});
  const res = await request('GET', `https://api.apliiq.com/v1/Order/${lookupId}`, null, {
    Authorization: auth,
    Accept: 'application/json',
  });
  return { status: res.status, data: res.body };
}

// --- Email via Resend ---
async function sendTrackingEmail({ orderId, customerEmail, customerName, trackingNumber, carrier, resendApiKey }) {
  const carrierUpper = (carrier || '').toUpperCase();
  const trackingUrls = {
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    FEDEX: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  const trackingUrl = trackingUrls[carrierUpper] || `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`;
  const firstName = (customerName || '').split(' ')[0] || 'there';

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a1a1a">Your order has shipped!</h2>
<p>Hey ${firstName}, great news — your 9thform order is on its way.</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
  <tr><td style="padding:8px;font-weight:bold">Tracking Number:</td><td style="padding:8px">${trackingNumber}</td></tr>
  ${carrier ? `<tr><td style="padding:8px;font-weight:bold">Carrier:</td><td style="padding:8px">${carrier}</td></tr>` : ''}
</table>
<p><a href="${trackingUrl}" style="background:#1a1a1a;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block">Track Your Order</a></p>
<p style="color:#666;font-size:14px">Order ID: ${orderId}</p>
<p style="color:#666;font-size:14px">Questions? Reply to this email or reach out at hello@9thform.com</p>
<p>Thanks for supporting 9thform 🙏</p>
</body></html>`;

  const res = await request('POST', 'https://api.resend.com/emails', {
    from: '9thform <hello@9thform.com>',
    to: [customerEmail],
    subject: 'Your 9thform order has shipped!',
    html,
  }, {
    Authorization: `Bearer ${resendApiKey}`,
  });
  return res;
}

// --- Main ---
console.log('Fetching recent submitted orders from Firestore...\n');
const secrets = await getApliiqSecrets();

if (!secrets.appKey || !secrets.sharedSecret) {
  console.error('Could not fetch Apliiq secrets from Secret Manager. Checking if token has access...');
  console.error('Try running: firebase login --reauth');
  process.exit(1);
}

console.log('Secrets loaded. Querying orders...\n');
const orders = await queryOrders();

if (orders.length === 0) {
  console.log('No submitted orders found.');
  process.exit(0);
}

console.log(`Found ${orders.length} submitted order(s):\n`);
for (const order of orders) {
  const alreadyHasTracking = !!order.trackingNumber;
  console.log(`  ${order._id} | ${order.customerEmail} | tracking=${order.trackingNumber || 'none'} | emailSent=${order.emailSent}`);
  if (alreadyHasTracking) continue;

  // Resolve lookup ID
  const lookupId = (!order.apliiqOrderId || order.apliiqOrderId === 'unknown')
    ? (order.apliiqNumericId || toNumericOrderId(order._id))
    : order.apliiqOrderId;

  console.log(`    → Checking Apliiq with lookupId=${lookupId}...`);
  const apliiq = await getApliiqTracking(lookupId, secrets.appKey, secrets.sharedSecret);
  console.log(`    → Apliiq response (${apliiq.status}):`, JSON.stringify(apliiq.data));

  // Apliiq returns an array of orders; pick the first match
  const apliiqOrder = Array.isArray(apliiq.data) ? apliiq.data[0] : apliiq.data;
  // Tracking is nested under SN[0].TrackingNumber
  const sn = apliiqOrder?.SN?.[0] || apliiqOrder?.sn?.[0];
  const trackingNumber =
    sn?.TrackingNumber ||
    sn?.trackingNumber ||
    sn?.tracking_number ||
    apliiqOrder?.tracking_number ||
    apliiqOrder?.trackingNumber ||
    apliiqOrder?.tracking ||
    null;
  // Derive carrier name from Service string (e.g. "USPS Ground Advantage" → "USPS")
  const serviceName = sn?.Service || sn?.service || apliiqOrder?.carrier || '';
  const carrier = serviceName.match(/\b(USPS|UPS|FedEx|DHL)\b/i)?.[1]?.toUpperCase() || '';

  if (!trackingNumber) {
    console.log(`    ✗ No tracking number yet from Apliiq.\n`);
    continue;
  }

  console.log(`    ✓ Found tracking: ${trackingNumber} (${carrier || 'unknown carrier'})`);

  // Update Firestore
  await patchOrder(order._id, {
    status: 'shipped',
    apliqStatus: 'shipped',
    trackingNumber,
    carrier,
  });
  console.log(`    ✓ Firestore updated`);

  // Send email
  if (order.customerEmail && !order.emailSent) {
    const emailRes = await sendTrackingEmail({
      orderId: order._id,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      trackingNumber,
      carrier,
      resendApiKey: secrets.resendApiKey,
    });
    console.log(`    ${emailRes.status === 200 ? '✓' : '✗'} Email to ${order.customerEmail} — status ${emailRes.status}: ${JSON.stringify(emailRes.body)}`);

    if (emailRes.status === 200) {
      await patchOrder(order._id, { emailSent: true });
    }
  } else if (order.emailSent) {
    console.log(`    — Email already sent, skipping.`);
  }

  console.log('');
}

console.log('Done.');
