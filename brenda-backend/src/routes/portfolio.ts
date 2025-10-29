import express from 'express';
import {
  getUserPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getPortfolioCategories,
  getUserPublicPortfolio,
  getPublicPortfolioItem,
  browsePublicPortfolio,
  getFeaturedPortfolio,
  searchPortfolio,
  trackPortfolioView,
  togglePortfolioLike,
  getPortfolioStats,
  getPortfolioItemStats,
  bulkUpdatePortfolio,
  reorderPortfolio,
  createPortfolioValidation,
  updatePortfolioValidation
} from '../controllers/portfolioController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../utils/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/categories', getPortfolioCategories);
router.get('/public/user/:userId', getUserPublicPortfolio);
router.get('/public/item/:id', getPublicPortfolioItem);
router.get('/browse', browsePublicPortfolio);
router.get('/featured', getFeaturedPortfolio);
router.get('/search', searchPortfolio);

// View tracking (optional auth - can track anonymous views)
router.post('/:id/view', optionalAuth, trackPortfolioView);

// Authentication required routes
router.use(authenticate);

// Portfolio CRUD operations
router.get('/', getUserPortfolio);
router.get('/:id', getPortfolioItem);
router.post('/', validate(createPortfolioValidation), createPortfolioItem);
router.put('/:id', validate(updatePortfolioValidation), updatePortfolioItem);
router.delete('/:id', deletePortfolioItem);

// Interactions
router.post('/:id/like', togglePortfolioLike);

// Statistics
router.get('/stats/overview', getPortfolioStats);
router.get('/:id/stats', getPortfolioItemStats);

// Bulk operations
router.post('/bulk/update', bulkUpdatePortfolio);
router.post('/bulk/reorder', reorderPortfolio);

export default router;
