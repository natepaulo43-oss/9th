import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Check if Firebase environment variables are set
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
const storageBucket = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.REACT_APP_FIREBASE_APP_ID;

// Check if all required Firebase config values are present
const isFirebaseConfigured = !!(apiKey && authDomain && projectId && appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Only initialize Firebase if all required config is available
if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: apiKey!,
      authDomain: authDomain!,
      projectId: projectId!,
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId!,
    };
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase configuration is missing. Admin features will be disabled.');
  console.warn('Missing Firebase env vars:', {
    hasApiKey: !!apiKey,
    hasAuthDomain: !!authDomain,
    hasProjectId: !!projectId,
    hasAppId: !!appId,
  });
}

export { auth };
export const isFirebaseEnabled = isFirebaseConfigured;
