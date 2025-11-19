import { auth as firebaseAuth } from '../config/firebase.js';

/**
 * Express middleware that verifies Firebase ID tokens supplied via the
 * Authorization header using the "Bearer <token>" convention.
 * Attaches decoded user information to the request object when valid.
 *
 * @param {import('express').Request} req - Incoming HTTP request
 * @param {import('express').Response} res - HTTP response object
 * @param {import('express').NextFunction} next - Callback to proceed
 */
export async function verifyToken(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const tokenMatch = authorizationHeader.match(/^Bearer\s+(.*)$/i);

  if (!tokenMatch) {
    return res.status(401).json({ error: 'Authorization token missing or malformed' });
  }

  const idToken = tokenMatch[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
    const { uid, email, ...claims } = decodedToken;

    req.user = {
      uid,
      email,
      claims,
    };

    return next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
