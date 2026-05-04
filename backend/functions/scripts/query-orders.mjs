/**
 * One-time script: find recent submitted/shipped orders missing tracking emails
 * Run with: node scripts/query-orders.mjs
 */
import admin from 'firebase-admin';

admin.initializeApp({ projectId: 'thform-33f71' });
const db = admin.firestore();

const snapshot = await db.collection('orders')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

const rows = snapshot.docs.map(doc => {
  const d = doc.data();
  return {
    id: doc.id,
    customerEmail: d.customerEmail,
    customerName: d.customerName,
    apliqStatus: d.apliqStatus,
    status: d.status,
    trackingNumber: d.trackingNumber || null,
    carrier: d.carrier || null,
    emailSent: d.emailSent || false,
    apliiqOrderId: d.apliiqOrderId || null,
    apliiqNumericId: d.apliiqNumericId || null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
  };
});

console.log(JSON.stringify(rows, null, 2));
process.exit(0);
