import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getPotentialMentors,
  getUserPublicProfile,
  blockUser,
  unblockUser,
} from '../controllers/userController';
import { authenticate, requireVerification } from '../middleware/auth';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile (for the logged in user)
router.get('/profile', getUserProfile);

// Get a public user profile
router.get('/:userId/profile', getUserPublicProfile);

// Update user profile (temporarily removing verification requirement for testing)
router.put('/profile', updateUserProfile);

// Block/unblock users
router.post('/block/:userId', blockUser);
router.delete('/unblock/:userId', unblockUser);

// Get potential mentors
router.get('/mentors', getPotentialMentors);

export default router;
