import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getAdminDashboard,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getContentForModeration,
  moderateContent,
  createForumCategory,
  updateForumCategory,
  deleteForumCategory,
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

// Forum Category Management
router.post('/forum/categories', createForumCategory);
router.put('/forum/categories/:categoryId', updateForumCategory);
router.delete('/forum/categories/:categoryId', deleteForumCategory);

// System Monitoring
router.get('/system/health', getSystemHealth);
router.get('/system/logs', getSystemLogs);

// Backup & Recovery
router.post('/backup/create', createBackup);

export default router;
