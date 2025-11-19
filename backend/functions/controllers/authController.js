import { auth as firebaseAuth } from '../config/firebase.js';
import {
  createUser as createUserService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from '../services/firebaseService.js';

const extractBearerToken = (authorizationHeader = '') => {
  const match = authorizationHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1] : null;
};

/**
 * Registers a new Firebase Authentication user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function register(req, res) {
  try {
    const { email, password, displayName } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await createUserService(email, password, displayName);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Unable to register user' });
    }

    const { uid, email: userEmail, displayName: userDisplayName } = result.data;
    return res.status(201).json({ uid, email: userEmail, displayName: userDisplayName });
  } catch (error) {
    console.error('Register controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Verifies a Firebase ID token supplied in the Authorization header.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function verifyToken(req, res) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: 'Authorization token missing or malformed' });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token, true);
    return res.status(200).json({ decodedToken });
  } catch (error) {
    const isExpired = error.code === 'auth/id-token-expired';
    return res.status(401).json({ error: isExpired ? 'Token expired' : 'Invalid token' });
  }
}

/**
 * Retrieves Firebase user data while ensuring the requester is authorized.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getUserData(req, res) {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.user || req.user.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await getUserByIdService(uid);

    if (!result.success) {
      const notFound = result.error?.includes('No user record');
      return res.status(notFound ? 404 : 500).json({ error: result.error || 'Unable to fetch user' });
    }

    const { uid: userId, email, displayName, customClaims } = result.data;
    return res.status(200).json({ uid: userId, email, displayName, customClaims });
  } catch (error) {
    console.error('Get user data controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Updates a Firebase user profile after verifying ownership.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function updateUserProfile(req, res) {
  try {
    const { uid } = req.params;
    const updateData = req.body || {};

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!req.user || req.user.uid !== uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await updateUserService(uid, updateData);

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Unable to update user' });
    }

    const { uid: userId, email, displayName, customClaims } = result.data;
    return res.status(200).json({ uid: userId, email, displayName, customClaims });
  } catch (error) {
    console.error('Update user profile controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
