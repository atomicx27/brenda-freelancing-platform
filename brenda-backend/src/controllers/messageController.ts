import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../types';
import prisma from '../utils/prisma';

// Validation rules
export const sendMessageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['TEXT', 'FILE', 'IMAGE'])
    .withMessage('Message type must be TEXT, FILE, or IMAGE'),
  body('attachment')
    .optional()
    .isString()
    .withMessage('Attachment must be a string')
];

export const getConversationValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const markAsReadValidation = [
  body('messageIds')
    .isArray()
    .withMessage('Message IDs must be an array'),
  body('messageIds.*')
    .isString()
    .withMessage('Each message ID must be a string')
];

// Send a message
export const sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          if (error.type === 'field') {
            acc[error.path] = [error.msg];
          }
          return acc;
        }, {} as Record<string, string[]>)
      };
      res.status(400).json(response);
      return;
    }

    const { receiverId, content, messageType = 'TEXT', attachment } = req.body;
    const senderId = req.user!.id;

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      const response: ApiResponse = {
        success: false,
        message: 'Receiver not found'
      };
      res.status(404).json(response);
      return;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        messageType,
        attachment
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Message sent successfully',
      data: message
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error sending message:', error);
    next(error);
  }
};

// Get conversation between two users
export const getConversation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          if (error.type === 'field') {
            acc[error.path] = [error.msg];
          }
          return acc;
        }, {} as Record<string, string[]>)
      };
      res.status(400).json(response);
      return;
    }

    const { userId } = req.params;
    const currentUserId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Get messages between current user and the specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Conversation retrieved successfully',
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting conversation:', error);
    next(error);
  }
};

// Get all conversations for current user
export const getConversations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    // Get all unique users that the current user has conversations with
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group conversations by the other user
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;
      const conversationKey = otherUser.id;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      } else {
        const existing = conversationMap.get(conversationKey);
        if (message.createdAt > existing.lastMessage.createdAt) {
          existing.lastMessage = message;
        }
      }
    });

    // Count unread messages for each conversation
    for (const [userId, conversation] of conversationMap) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: userId,
          receiverId: currentUserId,
          isRead: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversationList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    const response: ApiResponse = {
      success: true,
      message: 'Conversations retrieved successfully',
      data: {
        conversations: conversationList
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting conversations:', error);
    next(error);
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          if (error.type === 'field') {
            acc[error.path] = [error.msg];
          }
          return acc;
        }, {} as Record<string, string[]>)
      };
      res.status(400).json(response);
      return;
    }

    const { messageIds } = req.body;
    const currentUserId = req.user!.id;

    // Update messages to mark as read
    const updatedMessages = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: currentUserId
      },
      data: {
        isRead: true
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Messages marked as read',
      data: {
        updatedCount: updatedMessages.count
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    next(error);
  }
};

// Search messages
export const searchMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, userId, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user!.id;

    if (!q || typeof q !== 'string') {
      const response: ApiResponse = {
        success: false,
        message: 'Search query is required'
      };
      res.status(400).json(response);
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId }
      ],
      content: {
        contains: q,
        mode: 'insensitive'
      }
    };

    // If searching within a specific conversation
    if (userId) {
      whereClause.OR = [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ];
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limitNum
    });

    const totalMessages = await prisma.message.count({
      where: whereClause
    });

    const response: ApiResponse = {
      success: true,
      message: 'Messages found',
      data: {
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limitNum)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error searching messages:', error);
    next(error);
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: currentUserId,
        isRead: false
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Unread count retrieved',
      data: {
        unreadCount
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting unread count:', error);
    next(error);
  }
};

// Delete a message
export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user!.id;

    // Check if message exists and user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: currentUserId
      }
    });

    if (!message) {
      const response: ApiResponse = {
        success: false,
        message: 'Message not found or you do not have permission to delete it'
      };
      res.status(404).json(response);
      return;
    }

    await prisma.message.delete({
      where: {
        id: messageId
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Message deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting message:', error);
    next(error);
  }
};
