import { Router } from 'express';
import {
  register,
  verifyToken as verifyTokenController,
  getUserData,
  updateUserProfile,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/verify', verifyTokenController);
router.get('/user/:uid', verifyToken, getUserData);
router.put('/user/:uid', verifyToken, updateUserProfile);

export default router;
