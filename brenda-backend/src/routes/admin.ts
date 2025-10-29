import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getAdminDashboard,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getContentForModeration,
  moderateContent,
  getSystemHealth,
  createBackup,
  getSystemLogs
} from '../controllers/adminController';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.patch('/users/:userId/status', updateUserStatus);

// Content Moderation
router.get('/moderation/:type', getContentForModeration);
router.patch('/moderation/:contentId', moderateContent);

// System Monitoring
router.get('/system/health', getSystemHealth);
router.get('/system/logs', getSystemLogs);

// Backup & Recovery
router.post('/backup/create', createBackup);

export default router;
