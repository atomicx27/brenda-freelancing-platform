import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  advancedJobSearch,
  advancedFreelancerSearch,
  getSearchFilters,
  saveSearchPreferences,
  getSearchPreferences
} from '../controllers/searchController';

const router = express.Router();

// Public search routes
router.get('/jobs', advancedJobSearch);
router.get('/freelancers', advancedFreelancerSearch);
router.get('/filters', getSearchFilters);

// Authenticated routes for saving preferences
router.use(authenticate);
router.post('/preferences', saveSearchPreferences);
router.get('/preferences', getSearchPreferences);

export default router;


