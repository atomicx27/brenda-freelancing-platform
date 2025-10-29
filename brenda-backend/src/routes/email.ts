import express from 'express';
import { authenticate } from '../middleware/auth';
import { testSendEmail } from '../controllers/emailController';

const router = express.Router();

router.use(authenticate);

// Simple test endpoint to send an email via Resend
router.post('/send', testSendEmail);

export default router;
