import express from 'express';
import {
  createProposal,
  getJobProposals,
  getUserProposals,
  getProposalById,
  updateProposalStatus,
  updateProposal,
  deleteProposal,
  getProposalStats,
  createProposalValidation,
  updateProposalValidation
} from '../controllers/proposalController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validation';

const router = express.Router();

// All proposal routes require authentication
router.use(authenticate);

// Proposal management routes
router.post('/', validate(createProposalValidation), createProposal);
router.get('/my-proposals', getUserProposals);
router.get('/stats', getProposalStats);
router.get('/:id', getProposalById);
router.put('/:id', validate(updateProposalValidation), updateProposal);
router.delete('/:id', deleteProposal);

// Job-specific proposal routes
router.get('/job/:jobId', getJobProposals);
router.put('/:id/status', updateProposalStatus);

export default router;

