import express from 'express';
import {
  createReview,
  getUserReviews,
  getUserAuthoredReviews,
  updateReview,
  deleteReview,
  getRecentReviews,
  reportReview,
  createReviewValidation
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/recent', getRecentReviews);
router.get('/user/:userId', getUserReviews);

// Protected routes (require authentication)
router.use(authenticate);

// Review management routes
router.post('/', createReviewValidation, createReview);
router.get('/my-reviews', getUserAuthoredReviews);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
router.post('/:reviewId/report', reportReview);

export default router;
