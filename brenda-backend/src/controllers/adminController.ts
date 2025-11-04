import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';

// Database retry helper
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || !error.message?.includes('connection') && !error.message?.includes('timeout')) {
        throw error;
      }
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
};

// Get admin dashboard overview
export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalProposals,
      totalReviews,
      totalMessages,
      recentUsers,
      recentJobs,
      systemHealth
    ] = await withRetry(async () => {
      return await Promise.all([
        // User statistics
        prisma.user.count(),
        prisma.user.count({ where: { userType: 'FREELANCER' } }),
        prisma.user.count({ where: { userType: 'CLIENT' } }),
        prisma.user.count({ where: { userType: 'ADMIN' } }),
        
        // Job statistics
        prisma.job.count(),
        prisma.job.count({ where: { status: 'OPEN' } }),
        prisma.job.count({ where: { status: 'CLOSED' } }),
        
        // Proposal statistics
        prisma.proposal.count(),
        prisma.proposal.count({ where: { status: 'PENDING' } }),
        prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
        
        // Review statistics
        prisma.review.count(),
        
        // Message statistics
        prisma.message.count(),
        
        // Recent activity
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
            createdAt: true
          }
        }),
        
        prisma.job.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        
        // System health check
        checkSystemHealth()
      ]);
    });

    const dashboardData = {
      overview: {
        users: {
          total: totalUsers,
          freelancers: totalUsers,
          clients: totalUsers,
          admins: totalUsers
        },
        jobs: {
          total: totalJobs,
          open: totalJobs,
          closed: totalJobs
        },
        proposals: {
          total: totalProposals,
          pending: totalProposals,
          accepted: totalProposals
        },
        reviews: {
          total: totalReviews
        },
        messages: {
          total: totalMessages
        }
      },
      recentActivity: {
        users: recentUsers,
        jobs: recentJobs
      },
      systemHealth
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    next(error);
  }
};

// Get all users with advanced filtering
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    if (isVerified !== undefined) {
      where.profile = {
        isVerified: isVerified === 'true'
      };
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [users, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            profile: true,
            _count: {
              select: {
                jobs: true,
                proposals: true,
                reviews: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    next(error);
  }
};

// Get user details for admin
export const getUserDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          jobs: {
            include: {
              proposals: {
                include: {
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          proposals: {
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  budget: true
                }
              }
            }
          },
          reviews: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              },
              receiver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              jobs: true,
              proposals: true,
              reviews: true,
              messages: true,
              receivedMessages: true
            }
          }
        }
      });
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    next(error);
  }
};

// Update user status (ban/unban, verify/unverify)
export const updateUserStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;

    if (!['ban', 'unban', 'verify', 'unverify', 'delete'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
      return;
    }

    let updateData: any = {};
    let logMessage = '';

    switch (action) {
      case 'ban':
        updateData = { isActive: false };
        logMessage = `User banned by admin. Reason: ${reason || 'No reason provided'}`;
        break;
      case 'unban':
        updateData = { isActive: true };
        logMessage = `User unbanned by admin`;
        break;
      case 'verify':
        updateData = {
          profile: {
            upsert: {
              create: {
                isVerified: true
              },
              update: {
                isVerified: true
              }
            }
          }
        };
        logMessage = `User verified by admin`;
        break;
      case 'unverify':
        updateData = {
          profile: {
            upsert: {
              create: {
                isVerified: false
              },
              update: {
                isVerified: false
              }
            }
          }
        };
        logMessage = `User verification removed by admin`;
        break;
      case 'delete':
        // Soft delete by deactivating
        updateData = { isActive: false };
        logMessage = `User account deactivated by admin. Reason: ${reason || 'No reason provided'}`;
        break;
    }

    const user = await withRetry(async () => {
      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          profile: true
        }
      });
    });

    // Log admin action
    console.log(`Admin Action: ${logMessage} - User: ${user.email} - Admin: ${req.user?.email}`);

    res.json({
      success: true,
      message: `User ${action} successful`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    next(error);
  }
};

// Get content for moderation
export const getContentForModeration = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, status = 'pending', page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let where: any = {};

    // Build where clause based on content type and status
    switch (type) {
      case 'reviews':
        where = {
          status: status === 'pending' ? 'PENDING' : status === 'approved' ? 'APPROVED' : 'REJECTED'
        };
        break;
      case 'jobs':
        where = {
          status: status === 'pending' ? 'PENDING' : status === 'approved' ? 'OPEN' : 'REJECTED'
        };
        break;
      case 'profiles':
        where = {
          profile: {
            isVerified: status === 'pending' ? false : status === 'approved' ? true : false
          }
        };
        break;
    }

    let content: any[] = [];
    let total = 0;

    switch (type) {
      case 'reviews':
        [content, total] = await withRetry(async () => {
          return await Promise.all([
            prisma.review.findMany({
              where,
              skip,
              take: Number(limit),
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                receiver: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }),
            prisma.review.count({ where })
          ]);
        });
        break;

      case 'jobs':
        [content, total] = await withRetry(async () => {
          return await Promise.all([
            prisma.job.findMany({
              where,
              skip,
              take: Number(limit),
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }),
            prisma.job.count({ where })
          ]);
        });
        break;

      case 'profiles':
        [content, total] = await withRetry(async () => {
          return await Promise.all([
            prisma.user.findMany({
              where,
              skip,
              take: Number(limit),
              include: {
                profile: true
              },
              orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
          ]);
        });
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
        return;
    }

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching content for moderation:', error);
    next(error);
  }
};

// -------------------- Forum Category Management (Admin) --------------------
export const createForumCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description = '', color = '#CBD5E1', icon = '', sortOrder = 0, isActive = true } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'name and slug are required' });
      return;
    }

    const category = await withRetry(async () => {
      return await prisma.forumCategory.create({
        data: { name, slug, description, color, icon, sortOrder, isActive }
      });
    });

    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    console.error('Error creating forum category:', error);
    next(error);
  }
};

export const updateForumCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await withRetry(async () => {
      return await prisma.forumCategory.update({ where: { id: categoryId }, data: updates });
    });

    res.json({ success: true, data: { category } });
  } catch (error) {
    console.error('Error updating forum category:', error);
    next(error);
  }
};

export const deleteForumCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    await withRetry(async () => {
      return await prisma.forumCategory.delete({ where: { id: categoryId } });
    });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting forum category:', error);
    next(error);
  }
};

// Moderate content (approve/reject)
export const moderateContent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { type, action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
      return;
    }

    let updateData: any = {};
    let logMessage = '';

    switch (type) {
      case 'review':
        updateData = {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED'
        };
        logMessage = `Review ${action}d by admin. Reason: ${reason || 'No reason provided'}`;
        break;

      case 'job':
        updateData = {
          status: action === 'approve' ? 'OPEN' : 'REJECTED'
        };
        logMessage = `Job ${action}d by admin. Reason: ${reason || 'No reason provided'}`;
        break;

      case 'profile':
        updateData = {
          profile: {
            update: {
              isVerified: action === 'approve'
            }
          }
        };
        logMessage = `Profile ${action}d by admin. Reason: ${reason || 'No reason provided'}`;
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
        return;
    }

    let result: any;

    switch (type) {
      case 'review':
        result = await withRetry(async () => {
          return await prisma.review.update({
            where: { id: contentId },
            data: updateData
          });
        });
        break;

      case 'job':
        result = await withRetry(async () => {
          return await prisma.job.update({
            where: { id: contentId },
            data: updateData
          });
        });
        break;

      case 'profile':
        result = await withRetry(async () => {
          return await prisma.user.update({
            where: { id: contentId },
            data: updateData,
            include: {
              profile: true
            }
          });
        });
        break;
    }

    // Log admin action
    console.log(`Admin Action: ${logMessage} - Content ID: ${contentId} - Admin: ${req.user?.email}`);

    res.json({
      success: true,
      message: `Content ${action} successful`,
      data: result
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    next(error);
  }
};

// Get system health status
export const getSystemHealth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await checkSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    next(error);
  }
};

// System health check function
async function checkSystemHealth() {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Check disk space (simplified)
    const diskUsage = process.memoryUsage();
    
    // Check active connections
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: dbResponseTime,
        statusCode: dbResponseTime < 1000 ? 'good' : dbResponseTime < 3000 ? 'warning' : 'critical'
      },
      memory: {
        used: Math.round(diskUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(diskUsage.heapTotal / 1024 / 1024), // MB
        statusCode: diskUsage.heapUsed / diskUsage.heapTotal < 0.8 ? 'good' : 'warning'
      },
      activity: {
        activeUsers24h: activeUsers,
        statusCode: activeUsers > 0 ? 'good' : 'warning'
      },
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'disconnected',
        responseTime: null,
        statusCode: 'critical'
      }
    };
  }
}

// Create backup
export const createBackup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const backupData = await withRetry(async () => {
      return await Promise.all([
        prisma.user.findMany({
          include: {
            profile: true,
            jobs: true,
            proposals: true,
            reviews: true
          }
        }),
        prisma.job.findMany({
          include: {
            owner: true,
            proposals: true
          }
        }),
        prisma.proposal.findMany({
          include: {
            author: true,
            job: true
          }
        }),
        prisma.review.findMany({
          include: {
            author: true,
            receiver: true
          }
        }),
        prisma.message.findMany({
          include: {
            sender: true,
            receiver: true
          }
        })
      ]);
    });

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users: backupData[0],
        jobs: backupData[1],
        proposals: backupData[2],
        reviews: backupData[3],
        messages: backupData[4]
      },
      metadata: {
        totalUsers: backupData[0].length,
        totalJobs: backupData[1].length,
        totalProposals: backupData[2].length,
        totalReviews: backupData[3].length,
        totalMessages: backupData[4].length
      }
    };

    // In a real application, you would save this to a file or cloud storage
    // For now, we'll return it as a response
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    next(error);
  }
};

// Get system logs
export const getSystemLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { level, limit = 100 } = req.query;

    // In a real application, you would read from log files
    // For now, we'll return mock log data
    const logs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User authentication successful',
        userId: 'user123',
        ip: '192.168.1.1'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'warn',
        message: 'Rate limit exceeded for user',
        userId: 'user456',
        ip: '192.168.1.2'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'error',
        message: 'Database connection timeout',
        userId: null,
        ip: null
      }
    ];

    const filteredLogs = level ? logs.filter(log => log.level === level) : logs;

    res.json({
      success: true,
      data: {
        logs: filteredLogs.slice(0, Number(limit)),
        total: filteredLogs.length
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    next(error);
  }
};
