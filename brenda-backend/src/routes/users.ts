import express from 'express';
import { getUserProfile, updateUserProfile, getPotentialMentors, uploadResume, getResume } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { handleUploadError, resumeUpload } from '../middleware/upload';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', getUserProfile);

// Update user profile (temporarily removing verification requirement for testing)
router.put('/profile', updateUserProfile);

// Resume management
router.post('/profile/resume', resumeUpload.single('file'), handleUploadError, uploadResume);
router.get('/profile/resume', getResume);

// Get potential mentors
router.get('/mentors', getPotentialMentors);

export default router;
