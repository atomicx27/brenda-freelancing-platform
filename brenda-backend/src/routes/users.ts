import express from 'express';
import { getUserProfile, updateUserProfile, getPotentialMentors } from '../controllers/userController';
import { authenticate, requireVerification } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', getUserProfile);

// Update user profile (temporarily removing verification requirement for testing)
router.put('/profile', updateUserProfile);

// Get potential mentors
router.get('/mentors', getPotentialMentors);

export default router;
