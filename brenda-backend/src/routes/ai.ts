import express from 'express';
import {
  enhanceJobDescriptionHandler,
  enhanceProposalHandler,
  generateJobSuggestionsHandler,
  analyzeProposalHandler,
  generateCoverLetterHandler,
  suggestForumPostHandler,
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Enhance job description with AI
router.post('/enhance-job-description', enhanceJobDescriptionHandler);

// Enhance proposal with AI
router.post('/enhance-proposal', enhanceProposalHandler);

// Generate job suggestions
router.post('/job-suggestions', generateJobSuggestionsHandler);

// Analyze proposal and provide feedback
router.post('/analyze-proposal', analyzeProposalHandler);

// Generate cover letter
router.post('/generate-cover-letter', generateCoverLetterHandler);

// Suggest forum post (title/content/tags)
router.post('/suggest-forum-post', suggestForumPostHandler);

export default router;
