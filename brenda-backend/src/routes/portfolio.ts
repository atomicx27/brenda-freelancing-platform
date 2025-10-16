import express from 'express';
import {
  getUserPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getPortfolioCategories,
  createPortfolioValidation,
  updatePortfolioValidation
} from '../controllers/portfolioController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/categories', getPortfolioCategories);

// All other routes require authentication
router.use(authenticate);

// Portfolio CRUD operations
router.get('/', getUserPortfolio);
router.get('/:id', getPortfolioItem);
router.post('/', validate(createPortfolioValidation), createPortfolioItem);
router.put('/:id', validate(updatePortfolioValidation), updatePortfolioItem);
router.delete('/:id', deletePortfolioItem);

export default router;
