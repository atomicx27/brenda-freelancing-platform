import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, AppError } from '../types';
import { createError } from '../middleware/errorHandler';

// Helper for database retries
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || !error.message?.includes('connection') && !error.message?.includes('timeout')) {
        throw error;
      }
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Max retries exceeded');
};

// ==================== FORUM SYSTEM ====================

// Get forum categories
export const getForumCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await withRetry(() =>
      prisma.forumCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { posts: true }
          }
        }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// Get forum posts
export const getForumPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      categoryId, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search,
      tags
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status: 'PUBLISHED' };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagsArray };
    }

    const [posts, total] = await withRetry(async () => {
      return Promise.all([
        prisma.forumPost.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            _count: {
              select: {
                comments: true
              }
            }
          }
        }),
        prisma.forumPost.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create forum post
export const createForumPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, categoryId, tags = [] } = req.body;
    const authorId = req.user!.id;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const post = await withRetry(() =>
      prisma.forumPost.create({
        data: {
          title,
          content,
          slug,
          categoryId,
          authorId,
          tags
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Forum post created successfully',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// Get forum post details
export const getForumPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;

    const post = await withRetry(() =>
      prisma.forumPost.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatar: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          _count: {
            select: {
              comments: true
            }
          }
        }
      })
    );

    if (!post) {
      throw createError('Forum post not found', 404);
    }

    // Increment view count
    await withRetry(() =>
      prisma.forumPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// Create forum comment
export const createForumComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const authorId = req.user!.id;

    const comment = await withRetry(() =>
      prisma.forumComment.create({
        data: {
          content,
          postId,
          authorId,
          parentId: parentId || null
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })
    );

    // Update comment count
    await withRetry(() =>
      prisma.forumPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } }
      })
    );

    // Notify subscribers (simple in-app notifications)
    try {
      const subs = await withRetry(() => (prisma as any).forumSubscription.findMany({ where: { postId } }));
      const userIds = (Array.isArray(subs) ? subs : []).map((s: any) => s.userId).filter((uid: any) => uid !== authorId);
      // Also include post author if not the commenter
      const post = await withRetry(() => prisma.forumPost.findUnique({ where: { id: postId } }));
      if (post && post.authorId && post.authorId !== authorId && !userIds.includes(post.authorId)) {
        userIds.push(post.authorId);
      }

      for (const uid of userIds) {
  await withRetry(() => (prisma as any).notification.create({ data: { userId: uid, type: 'NEW_COMMENT', data: { postId, commentId: comment.id, actorId: authorId, message: 'New comment on a thread you follow' } } }));
      }
    } catch (e) {
      console.warn('Failed to create notifications for subscribers', e);
    }

    res.status(201).json({
      status: 'success',
      message: 'Comment created successfully',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

// Subscribe to a forum post
export const subscribeToPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const sub = await withRetry(() => (prisma as any).forumSubscription.upsert({
      where: { userId_postId: { userId, postId } },
      update: {},
      create: { userId, postId }
    }));

    res.status(201).json({ status: 'success', message: 'Subscribed', data: { subscription: sub } });
  } catch (error) {
    next(error);
  }
};

// Unsubscribe from a forum post
export const unsubscribeFromPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

  await withRetry(() => (prisma as any).forumSubscription.delete({ where: { userId_postId: { userId, postId } } }));

    res.json({ status: 'success', message: 'Unsubscribed' });
  } catch (error) {
    next(error);
  }
};

// Get notifications for current user
export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
  const notifications = await withRetry(() => (prisma as any).notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }));
    res.json({ status: 'success', data: { notifications } });
  } catch (error) {
    next(error);
  }
};

// Check if current user is subscribed to a post
export const checkSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

  const existing = await withRetry(() => (prisma as any).forumSubscription.findUnique({ where: { userId_postId: { userId, postId } } }));
    res.json({ status: 'success', data: { subscribed: !!existing } });
  } catch (error) {
    next(error);
  }
};

// ==================== USER GROUPS ====================

// Get user groups
export const getUserGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search,
      isPublic = 'true'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { 
      isActive: true,
      isPublic: isPublic === 'true'
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [groups, total] = await withRetry(async () => {
      return Promise.all([
        prisma.userGroup.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                members: true,
                posts: true
              }
            }
          }
        }),
        prisma.userGroup.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        groups,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create user group
export const createUserGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      name, 
      description, 
      category, 
      isPublic = true, 
      rules, 
      tags = [] 
    } = req.body;
    const createdBy = req.user!.id;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const group = await withRetry(() =>
      prisma.userGroup.create({
        data: {
          name,
          description,
          slug,
          category,
          isPublic,
          rules,
          tags,
          createdBy
        }
      })
    );

    // Add creator as owner
    await withRetry(() =>
      prisma.userGroupMember.create({
        data: {
          groupId: group.id,
          userId: createdBy,
          role: 'OWNER'
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'User group created successfully',
      data: { group }
    });
  } catch (error) {
    next(error);
  }
};

// Join user group
export const joinUserGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    // Check if already a member
    const existingMember = await withRetry(() =>
      prisma.userGroupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId }
        }
      })
    );

    if (existingMember) {
      throw createError('You are already a member of this group', 400);
    }

    // check if group requires approval
    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { id: groupId } }));
    if (!group) throw createError('Group not found', 404);

    if (group.requiresApproval) {
      // create or upsert a join request
      const existingRequest = await withRetry(() => prisma.userGroupJoinRequest.findUnique({ where: { groupId_userId: { groupId, userId } } }).catch(() => null));
      if (existingRequest) {
        res.status(200).json({ status: 'success', message: 'Join request already pending', data: { request: existingRequest } });
        return;
      }

      const request = await withRetry(() => prisma.userGroupJoinRequest.create({ data: { groupId, userId, status: 'PENDING' } }));
      res.status(201).json({ status: 'success', message: 'Join request submitted', data: { request } });
      return;
    }

    const member = await withRetry(() =>
      prisma.userGroupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER'
        }
      })
    );

    // Update member count
    await withRetry(() =>
      prisma.userGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Successfully joined the group',
      data: { member }
    });
  } catch (error) {
    next(error);
  }
};

// Helper: check if user is owner or moderator
const isOwnerOrModerator = async (userId: string, groupId: string) => {
  const membership = await prisma.userGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!membership) return false;
  return membership.role === 'OWNER' || membership.role === 'MODERATOR';
};

// Get join requests for a group (owners/mods only)
export const getGroupJoinRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user!.id;

    const allowed = await isOwnerOrModerator(userId, groupId);
    if (!allowed) throw createError('Unauthorized', 403);

    const requests = await withRetry(() =>
      prisma.userGroupJoinRequest.findMany({ where: { groupId, status: 'PENDING' }, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } })
    );

    res.status(200).json({ status: 'success', data: { requests } });
  } catch (error) {
    next(error);
  }
};

// Approve join request
export const approveJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, requestId } = req.params;
    const userId = req.user!.id;

    const allowed = await isOwnerOrModerator(userId, groupId);
    if (!allowed) throw createError('Unauthorized', 403);

    const request = await withRetry(() => prisma.userGroupJoinRequest.findUnique({ where: { id: requestId } }));
    if (!request || request.groupId !== groupId) throw createError('Request not found', 404);

    await withRetry(() => prisma.userGroupMember.create({ data: { groupId, userId: request.userId, role: 'MEMBER' } }));
    await withRetry(() => prisma.userGroup.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } }));
    await withRetry(() => prisma.userGroupJoinRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } }));

    res.status(200).json({ status: 'success', message: 'Request approved' });
  } catch (error) {
    next(error);
  }
};

// Reject join request
export const rejectJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, requestId } = req.params;
    const userId = req.user!.id;

    const allowed = await isOwnerOrModerator(userId, groupId);
    if (!allowed) throw createError('Unauthorized', 403);

    const request = await withRetry(() => prisma.userGroupJoinRequest.findUnique({ where: { id: requestId } }));
    if (!request || request.groupId !== groupId) throw createError('Request not found', 404);

    await withRetry(() => prisma.userGroupJoinRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } }));

    res.status(200).json({ status: 'success', message: 'Request rejected' });
  } catch (error) {
    next(error);
  }
};

// Pin or unpin a group post (owner/mod)
export const togglePinGroupPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug, postId } = req.params;
    const userId = req.user!.id;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) throw createError('Group not found', 404);

    const allowed = await isOwnerOrModerator(userId, group.id);
    if (!allowed) throw createError('Unauthorized', 403);

    const post = await withRetry(() => prisma.groupPost.findUnique({ where: { id: postId } }));
    if (!post) throw createError('Post not found', 404);

    const updated = await withRetry(() => prisma.groupPost.update({ where: { id: postId }, data: { isPinned: { set: !post.isPinned } } }));

    res.status(200).json({ status: 'success', data: { post: updated } });
  } catch (error) {
    next(error);
  }
};

// Delete a group post (owner/mod)
export const deleteGroupPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug, postId } = req.params;
    const userId = req.user!.id;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) throw createError('Group not found', 404);

    const allowed = await isOwnerOrModerator(userId, group.id);
    if (!allowed) throw createError('Unauthorized', 403);

    await withRetry(() => prisma.groupPost.delete({ where: { id: postId } }));
    // decrement post count
    await withRetry(() => prisma.userGroup.update({ where: { id: group.id }, data: { postCount: { decrement: 1 } } }));

    res.status(200).json({ status: 'success', message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// Remove member from group (owner/mod)
export const removeGroupMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    const actorId = req.user!.id;

    const allowed = await isOwnerOrModerator(actorId, groupId);
    if (!allowed) throw createError('Unauthorized', 403);

    const membership = await withRetry(() => prisma.userGroupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }));
    if (!membership) throw createError('Member not found', 404);

    await withRetry(() => prisma.userGroupMember.delete({ where: { id: membership.id } }));
    await withRetry(() => prisma.userGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } }));

    res.status(200).json({ status: 'success', message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// Get single user group by slug
export const getUserGroupBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const group = await withRetry(() =>
      prisma.userGroup.findUnique({
        where: { slug },
        include: {
          _count: {
            select: { members: true, posts: true }
          }
        }
      })
    );

    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { group } });
  } catch (error) {
    next(error);
  }
};

// Get posts for a group (public)
export const getGroupPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await withRetry(async () => {
      return Promise.all([
        prisma.groupPost.findMany({
          where: { groupId: group.id, status: 'PUBLISHED' },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } }
          }
        }),
        prisma.groupPost.count({ where: { groupId: group.id, status: 'PUBLISHED' } })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a post inside a group (requires auth)
export const createGroupPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const { title, content, tags = [] } = req.body;
    const authorId = req.user!.id;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    // If group is private, ensure user is a member
    if (!group.isPublic) {
      const membership = await withRetry(() =>
        prisma.userGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: authorId } } })
      );
      if (!membership) {
        res.status(403).json({ status: 'error', message: 'You must be a member to post in this group' });
        return;
      }
    }

    // Note: GroupPost model does not include a `slug` field in the schema.
    // Create the post without a slug to match Prisma schema.
    const post = await withRetry(() =>
      prisma.groupPost.create({
        data: { title, content, groupId: group.id, authorId, tags },
        include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
      })
    );

    // increment group's postCount
    await withRetry(() => prisma.userGroup.update({ where: { id: group.id }, data: { postCount: { increment: 1 } } }));

    res.status(201).json({ status: 'success', message: 'Post created', data: { post } });
  } catch (error) {
    next(error);
  }
};

// Get group post details by id
export const getGroupPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug, postId } = req.params;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    const post = await withRetry(() =>
      prisma.groupPost.findUnique({
        where: { id: postId },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          comments: {
            where: { parentId: null, status: 'PUBLISHED' },
            include: {
              author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              replies: {
                include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    );

    if (!post) {
      res.status(404).json({ status: 'error', message: 'Post not found' });
      return;
    }

    res.status(200).json({ status: 'success', data: { post } });
  } catch (error) {
    next(error);
  }
};

// Create comment on a group post
export const createGroupPostComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug, postId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user!.id;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    const post = await withRetry(() => prisma.groupPost.findUnique({ where: { id: postId } }));
    if (!post) {
      res.status(404).json({ status: 'error', message: 'Post not found' });
      return;
    }

    // If group is private, ensure user is member
    if (!group.isPublic) {
      const membership = await withRetry(() =>
        prisma.userGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
      );
      if (!membership) {
        res.status(403).json({ status: 'error', message: 'You must be a member to comment in this group' });
        return;
      }
    }

    const comment = await withRetry(() =>
      prisma.groupPostComment.create({
        data: { content, postId, authorId: userId, parentId },
        include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
      })
    );

    // increment comment count
    await withRetry(() => prisma.groupPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }));

    res.status(201).json({ status: 'success', message: 'Comment added', data: { comment } });
  } catch (error) {
    next(error);
  }
};

// Check membership for current user in group
export const checkGroupMembership = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const userId = req.user!.id;

    const group = await withRetry(() => prisma.userGroup.findUnique({ where: { slug } }));
    if (!group) {
      res.status(404).json({ status: 'error', message: 'Group not found' });
      return;
    }

    const membership = await withRetry(() =>
      prisma.userGroupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId } } })
    );

    res.status(200).json({ status: 'success', data: { isMember: !!membership, role: membership?.role || null } });
  } catch (error) {
    next(error);
  }
};

// ==================== MENTORSHIP SYSTEM ====================

// Get mentorships
export const getMentorships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      skills,
      status = 'ACTIVE'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { 
      isActive: true,
      status: status as any
    };

    if (category) {
      where.category = category;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      where.skills = { hasSome: skillsArray };
    }

    const [mentorships, total] = await withRetry(async () => {
      return Promise.all([
        prisma.mentorship.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            mentor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                profile: {
                  select: {
                    title: true,
                    skills: true,
                    experience: true
                  }
                }
              }
            },
            mentee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }),
        prisma.mentorship.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        mentorships,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create mentorship request
export const createMentorshipRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mentorId, title, description, category, skills = [] } = req.body;
    const menteeId = req.user!.id;

    if (mentorId === menteeId) {
      throw createError('You cannot request mentorship from yourself', 400);
    }

    const mentorship = await withRetry(() =>
      prisma.mentorship.create({
        data: {
          mentorId,
          menteeId,
          title,
          description,
          category,
          skills,
          status: 'PENDING'
        },
        include: {
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          mentee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Mentorship request sent successfully',
      data: { mentorship }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== KNOWLEDGE BASE ====================

// Get knowledge articles
export const getKnowledgeArticles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      categoryId, 
      page = 1, 
      limit = 20, 
      search,
      isFeatured,
      tags
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { isPublished: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagsArray };
    }

    const [articles, total] = await withRetry(async () => {
      return Promise.all([
        prisma.knowledgeArticle.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { publishedAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }),
        prisma.knowledgeArticle.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        articles,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get FAQs
export const getFAQs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, isFeatured } = req.query;

    const where: any = { isPublished: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { question: { contains: search as string, mode: 'insensitive' } },
        { answer: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    const faqs = await withRetry(() =>
      prisma.fAQ.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      })
    );

    res.status(200).json({
      status: 'success',
      data: { faqs }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COMMUNITY EVENTS ====================

// Get community events
export const getCommunityEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      eventType, 
      isOnline,
      upcoming = 'true'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { 
      isActive: true,
      isPublic: true
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true';
    }

    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
    }

    const [events, total] = await withRetry(async () => {
      return Promise.all([
        prisma.communityEvent.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { startDate: 'asc' },
          include: {
            _count: {
              select: { attendees: true }
            }
          }
        }),
        prisma.communityEvent.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        events,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Join community event
export const joinCommunityEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;

    // Check if already registered
    const existingAttendee = await withRetry(() =>
      prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: { eventId, userId }
        }
      })
    );

    if (existingAttendee) {
      throw createError('You are already registered for this event', 400);
    }

    const attendee = await withRetry(() =>
      prisma.eventAttendee.create({
        data: {
          eventId,
          userId,
          status: 'REGISTERED'
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Successfully registered for the event',
      data: { attendee }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SOCIAL FEATURES ====================

// Like content
export const likeContent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId, contentType } = req.body;
    const userId = req.user!.id;

    // Check if already liked
    const existingLike = await withRetry(() =>
      prisma.contentLike.findUnique({
        where: {
          userId_contentId_contentType: {
            userId,
            contentId,
            contentType: contentType as any
          }
        }
      })
    );

    if (existingLike) {
      // Unlike
      await withRetry(() =>
        prisma.contentLike.delete({
          where: { id: existingLike.id }
        })
      );

      // Update like count
      await updateLikeCount(contentId, contentType, -1);

      res.status(200).json({
        status: 'success',
        message: 'Content unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await withRetry(() =>
        prisma.contentLike.create({
          data: {
            userId,
            contentId,
            contentType: contentType as any
          }
        })
      );

      // Update like count
      await updateLikeCount(contentId, contentType, 1);

      res.status(201).json({
        status: 'success',
        message: 'Content liked',
        data: { liked: true }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to update like count
const updateLikeCount = async (contentId: string, contentType: string, increment: number) => {
  const updateData = { likeCount: { increment } };

  switch (contentType) {
    case 'FORUM_POST':
      await prisma.forumPost.update({ where: { id: contentId }, data: updateData });
      break;
    case 'GROUP_POST':
      await prisma.groupPost.update({ where: { id: contentId }, data: updateData });
      break;
    case 'KNOWLEDGE_ARTICLE':
      await prisma.knowledgeArticle.update({ where: { id: contentId }, data: updateData });
      break;
    case 'COMMENT':
      await prisma.forumComment.update({ where: { id: contentId }, data: updateData });
      break;
  }
};

// Get user connections
export const getUserConnections = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const connections = await withRetry(() =>
      prisma.socialConnection.findMany({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { connectedUserId: userId, status: 'ACCEPTED' }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          connectedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { connections }
    });
  } catch (error) {
    next(error);
  }
};

// Send connection request
export const sendConnectionRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { connectedUserId } = req.body;
    const userId = req.user!.id;

    if (userId === connectedUserId) {
      throw createError('You cannot connect with yourself', 400);
    }

    // Check if connection already exists
    const existingConnection = await withRetry(() =>
      prisma.socialConnection.findFirst({
        where: {
          OR: [
            { userId, connectedUserId },
            { userId: connectedUserId, connectedUserId: userId }
          ]
        }
      })
    );

    if (existingConnection) {
      throw createError('Connection already exists', 400);
    }

    const connection = await withRetry(() =>
      prisma.socialConnection.create({
        data: {
          userId,
          connectedUserId,
          status: 'PENDING'
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Connection request sent successfully',
      data: { connection }
    });
  } catch (error) {
    next(error);
  }
};
