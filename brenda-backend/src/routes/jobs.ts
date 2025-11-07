import express from 'express';
import {
  getAllJobs,
  getTodaysJobs,
  getJobById,
  getUserJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobCategories,
  getPopularSkills,
  createJobValidation,
  updateJobValidation,
  getJobApplicantAnalysis
} from '../controllers/jobController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../utils/validation';

const router = express.Router();

// Public routes (authentication optional for personalization)
router.get('/', optionalAuthenticate, getAllJobs);
router.get('/todays', optionalAuthenticate, getTodaysJobs);
router.get('/categories', getJobCategories);
router.get('/popular-skills', getPopularSkills);
router.get('/:id/applicants/analysis', authenticate, getJobApplicantAnalysis);
router.get('/:id', optionalAuthenticate, getJobById);

// All other routes require authentication
router.use(authenticate);

// Job management routes (for authenticated users)
router.get('/my/jobs', getUserJobs);
router.post('/', validate(createJobValidation), createJob);
router.put('/:id', validate(updateJobValidation), updateJob);
router.delete('/:id', deleteJob);

export default router;

