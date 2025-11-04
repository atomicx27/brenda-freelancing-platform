import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  submitMentorApplication,
  getMyMentorApplication,
  getAllMentorApplications,
  getMentorApplication,
  approveMentorApplication,
  rejectMentorApplication
} from '../controllers/mentorApplicationController';

const router = express.Router();

// User routes (authenticated)
router.use(authenticate);

// Submit or update mentor application
router.post('/apply', submitMentorApplication);

// Get current user's application
router.get('/my-application', getMyMentorApplication);

// Admin routes (require admin role)
router.use(requireAdmin);

// Get all applications (with filters)
router.get('/', getAllMentorApplications);

// Get single application details
router.get('/:id', getMentorApplication);

// Approve application
router.post('/:id/approve', approveMentorApplication);

// Reject application
router.post('/:id/reject', rejectMentorApplication);

export default router;
