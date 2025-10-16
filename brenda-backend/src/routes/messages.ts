import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  searchMessages,
  getUnreadCount,
  deleteMessage,
  sendMessageValidation,
  getConversationValidation,
  markAsReadValidation
} from '../controllers/messageController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/send', sendMessageValidation, sendMessage);

// Get conversation between two users
router.get('/conversation/:userId', getConversationValidation, getConversation);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Mark messages as read
router.patch('/mark-read', markAsReadValidation, markAsRead);

// Search messages
router.get('/search', searchMessages);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Delete a message
router.delete('/:messageId', deleteMessage);

export default router;


