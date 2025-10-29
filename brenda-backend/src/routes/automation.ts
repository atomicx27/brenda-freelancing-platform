import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  // Automation Rules
  getAutomationRules,
  createAutomationRule,
  executeAutomationRule,
  
  // Smart Contracts
  getSmartContracts,
  generateSmartContract,
  
  // Automated Invoicing
  getInvoices,
  generateInvoice,
  
  // Email Marketing
  getEmailCampaigns,
  createEmailCampaign,
  
  // Lead Scoring
  getLeadScores,
  calculateLeadScore,
  
  // Follow-up Automation
  getFollowUpRules,
  createFollowUpRule,
  
  // Deadline Reminders
  getReminders,
  createReminder,
  
  // Status Update Automation
  getStatusUpdateRules,
  createStatusUpdateRule
} from '../controllers/automationController';

const router = express.Router();

// All automation routes require authentication
router.use(authenticate);

// ==================== AUTOMATION RULES ROUTES ====================
router.get('/rules', getAutomationRules);
router.post('/rules', createAutomationRule);
router.post('/rules/:ruleId/execute', executeAutomationRule);

// ==================== SMART CONTRACTS ROUTES ====================
router.get('/contracts', getSmartContracts);
router.post('/contracts/generate', generateSmartContract);

// ==================== AUTOMATED INVOICING ROUTES ====================
router.get('/invoices', getInvoices);
router.post('/invoices/generate', generateInvoice);

// ==================== EMAIL MARKETING ROUTES ====================
router.get('/email-campaigns', getEmailCampaigns);
router.post('/email-campaigns', createEmailCampaign);

// ==================== LEAD SCORING ROUTES ====================
router.get('/lead-scores', getLeadScores);
router.post('/lead-scores/calculate', calculateLeadScore);

// ==================== FOLLOW-UP AUTOMATION ROUTES ====================
router.get('/follow-up-rules', getFollowUpRules);
router.post('/follow-up-rules', createFollowUpRule);

// ==================== DEADLINE REMINDERS ROUTES ====================
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);

// ==================== STATUS UPDATE AUTOMATION ROUTES ====================
router.get('/status-update-rules', getStatusUpdateRules);
router.post('/status-update-rules', createStatusUpdateRule);

export default router;


