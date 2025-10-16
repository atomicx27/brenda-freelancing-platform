import express from 'express';
import {
  getCompanyProfile,
  updateCompanyProfile,
  getPublicCompanyProfiles,
  getCompanyProfileById,
  getCompanyStats,
  getCompanyIndustries,
  createCompanyValidation,
  updateCompanyValidation
} from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getPublicCompanyProfiles);
router.get('/public/:id', getCompanyProfileById);
router.get('/industries', getCompanyIndustries);

// All other routes require authentication
router.use(authenticate);

// Company profile management
router.get('/profile', getCompanyProfile);
router.put('/profile', validate(updateCompanyValidation), updateCompanyProfile);
router.get('/stats', getCompanyStats);

export default router;
