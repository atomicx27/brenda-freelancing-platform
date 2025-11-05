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
  updateSmartContract,
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  
  // Automated Invoicing
  getInvoices,
  generateInvoice,
  processRecurringInvoices,
  updateInvoiceStatus,
  
  // Email Marketing
  getEmailCampaigns,
  createEmailCampaign,
  executeEmailCampaign,
  getEmailCampaignAnalytics,
  
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
router.patch('/contracts/:contractId', updateSmartContract);

// Contract Templates
router.get('/contract-templates', getContractTemplates);
router.post('/contract-templates', createContractTemplate);
router.put('/contract-templates/:templateId', updateContractTemplate);
router.delete('/contract-templates/:templateId', deleteContractTemplate);

// ==================== AUTOMATED INVOICING ROUTES ====================
router.get('/invoices', getInvoices);
router.post('/invoices/generate', generateInvoice);
router.post('/invoices/process-recurring', processRecurringInvoices);
router.patch('/invoices/:invoiceId/status', updateInvoiceStatus);

// ==================== EMAIL MARKETING ROUTES ====================
router.get('/email-campaigns', getEmailCampaigns);
router.post('/email-campaigns', createEmailCampaign);
router.post('/email-campaigns/:campaignId/execute', executeEmailCampaign);
router.get('/email-campaigns/:campaignId/analytics', getEmailCampaignAnalytics);

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


