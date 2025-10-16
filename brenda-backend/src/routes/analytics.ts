import express from 'express';
import {
  getFreelancerAnalytics,
  getClientAnalytics,
  getAdminAnalytics,
  getPlatformHealth
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// User-specific analytics
router.get('/freelancer', getFreelancerAnalytics);
router.get('/client', getClientAnalytics);

// Admin-only analytics
router.get('/admin', getAdminAnalytics);
router.get('/health', getPlatformHealth);

export default router;
