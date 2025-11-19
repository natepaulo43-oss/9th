import admin from 'firebase-admin';
import { getSecretValue, firebasePrivateKey } from './secrets.js';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_DATABASE_URL,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_CONFIG,
  GCLOUD_PROJECT,
  GOOGLE_CLOUD_PROJECT,
  SERVICE_ACCOUNT_PRIVATE_KEY,
} = process.env;

function getFirebaseConfig() {
  if (!FIREBASE_CONFIG) {
    return {};
  }

  try {
    return JSON.parse(FIREBASE_CONFIG);
  } catch (error) {
    console.warn('Failed to parse FIREBASE_CONFIG. Falling back to env vars.', error);
    return {};
  }
}

const firebaseRuntimeConfig = getFirebaseConfig();
const resolvedProjectId =
  FIREBASE_PROJECT_ID || firebaseRuntimeConfig.projectId || GOOGLE_CLOUD_PROJECT || GCLOUD_PROJECT;
const resolvedDatabaseUrl = FIREBASE_DATABASE_URL || firebaseRuntimeConfig.databaseURL;
const resolvedStorageBucket =
  FIREBASE_STORAGE_BUCKET ||
  firebaseRuntimeConfig.storageBucket ||
  (resolvedProjectId ? `${resolvedProjectId}.appspot.com` : undefined);

function buildAdminOptions() {
  const resolvedPrivateKey =
    getSecretValue(firebasePrivateKey, [
      'SERVICE_ACCOUNT_PRIVATE_KEY',
      'FIREBASE_PRIVATE_KEY',
    ]) || SERVICE_ACCOUNT_PRIVATE_KEY || FIREBASE_PRIVATE_KEY;
  const hasServiceAccount = FIREBASE_PROJECT_ID && resolvedPrivateKey && FIREBASE_CLIENT_EMAIL;

  if (!hasServiceAccount) {
    return {
      projectId: resolvedProjectId,
      databaseURL: resolvedDatabaseUrl,
      storageBucket: resolvedStorageBucket,
    };
  }

  return {
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: resolvedPrivateKey?.replace(/\n/g, '\n'),
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: resolvedDatabaseUrl,
    storageBucket: resolvedStorageBucket,
  };
}

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp(buildAdminOptions());
  }

  return {
    admin,
    db: admin.firestore(),
    auth: admin.auth(),
    storage: admin.storage().bucket(),
  };
}

const { db, auth, storage } = initializeFirebaseAdmin();

export { admin, db, auth, storage };
