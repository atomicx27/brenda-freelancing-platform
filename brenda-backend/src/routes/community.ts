import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  // Forum
  getForumCategories,
  getForumPosts,
  createForumPost,
  getForumPost,
  createForumComment,
  
  // User Groups
  getUserGroups,
  createUserGroup,
  joinUserGroup,
  
  // Mentorship
  getMentorships,
  createMentorshipRequest,
  
  // Knowledge Base
  getKnowledgeArticles,
  getFAQs,
  
  // Community Events
  getCommunityEvents,
  joinCommunityEvent,
  
  // Social Features
  likeContent,
  getUserConnections,
  sendConnectionRequest
} from '../controllers/communityController';

const router = express.Router();

// ==================== FORUM ROUTES ====================

// Public forum routes
router.get('/forum/categories', getForumCategories);
router.get('/forum/posts', getForumPosts);
router.get('/forum/posts/:postId', getForumPost);

// ==================== USER GROUPS ROUTES ====================

// Public user group routes
router.get('/groups', getUserGroups);

// ==================== MENTORSHIP ROUTES ====================

// Public mentorship routes
router.get('/mentorships', getMentorships);

// ==================== KNOWLEDGE BASE ROUTES ====================

// Public knowledge base routes
router.get('/knowledge/articles', getKnowledgeArticles);
router.get('/knowledge/faqs', getFAQs);

// ==================== COMMUNITY EVENTS ROUTES ====================

// Public community events routes
router.get('/events', getCommunityEvents);

// ==================== AUTHENTICATED ROUTES ====================

// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Authenticated forum routes
router.post('/forum/posts', createForumPost);
router.post('/forum/posts/:postId/comments', createForumComment);

// Authenticated user group routes
router.post('/groups', createUserGroup);
router.post('/groups/:groupId/join', joinUserGroup);

// Authenticated mentorship routes
router.post('/mentorships', createMentorshipRequest);

// Authenticated event routes
router.post('/events/:eventId/join', joinCommunityEvent);

// ==================== SOCIAL FEATURES ROUTES ====================

// Authenticated social routes
router.post('/social/like', likeContent);
router.get('/social/connections', getUserConnections);
router.post('/social/connect', sendConnectionRequest);

export default router;
