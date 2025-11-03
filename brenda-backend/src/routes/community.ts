import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
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
  getUserGroupBySlug,
  getGroupPosts,
  createGroupPost,
  getGroupPost,
  createGroupPostComment,
  checkGroupMembership,
  // join requests & moderation
  getGroupJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  togglePinGroupPost,
  deleteGroupPost,
  removeGroupMember,
  
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
  ,
  subscribeToPost,
  unsubscribeFromPost,
  getNotifications
  ,
  checkSubscription
} from '../controllers/communityController';

const router = express.Router();

// ==================== FORUM ROUTES ====================

// Public forum routes
router.get('/forum/categories', getForumCategories);
router.get('/forum/posts', getForumPosts);
router.get('/forum/posts/:postId', getForumPost);
router.get('/forum/posts/:postId/subscribed', authenticate, (req, res, next) => { next(); });

// ==================== USER GROUPS ROUTES ====================

// Public user group routes (with optional auth for membership info)
router.get('/groups', optionalAuthenticate, getUserGroups);
router.get('/groups/:slug', getUserGroupBySlug);
router.get('/groups/:slug/posts', getGroupPosts);
router.get('/groups/:slug/posts/:postId', getGroupPost);
router.get('/groups/:groupId/requests', authenticate, getGroupJoinRequests);

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
router.get('/forum/posts/:postId/subscribed', checkSubscription);
router.post('/forum/posts/:postId/subscribe', subscribeToPost);
router.delete('/forum/posts/:postId/unsubscribe', unsubscribeFromPost);

// Notifications
router.get('/notifications', getNotifications);

// Authenticated user group routes
router.post('/groups', createUserGroup);
router.post('/groups/:groupId/join', joinUserGroup);
router.post('/groups/:slug/posts', createGroupPost);
router.post('/groups/:slug/posts/:postId/comments', createGroupPostComment);
router.get('/groups/:slug/membership', checkGroupMembership);
router.post('/groups/:groupId/requests/:requestId/approve', approveJoinRequest);
router.post('/groups/:groupId/requests/:requestId/reject', rejectJoinRequest);
router.post('/groups/:slug/posts/:postId/pin', togglePinGroupPost);
router.delete('/groups/:slug/posts/:postId', deleteGroupPost);
router.delete('/groups/:groupId/members/:userId', removeGroupMember);

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
