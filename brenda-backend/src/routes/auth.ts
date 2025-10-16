import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  registerValidation,
  loginValidation
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;



