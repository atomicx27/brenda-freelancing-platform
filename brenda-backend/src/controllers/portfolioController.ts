import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// Validation rules for portfolio items
export const createPortfolioValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('liveUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('githubUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

export const updatePortfolioValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('liveUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('githubUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// Get all portfolio items for a user
export const getUserPortfolio = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category, featured, isPublic } = req.query;

    const where: any = { userId };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const portfolioItems = await prisma.portfolioItem.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio retrieved successfully',
      data: portfolioItems
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get a specific portfolio item
export const getPortfolioItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const portfolioItem = await prisma.portfolioItem.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!portfolioItem) {
      const response: ApiResponse = {
        success: false,
        message: 'Portfolio item not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio item retrieved successfully',
      data: portfolioItem
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Create a new portfolio item
export const createPortfolioItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
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

    const userId = req.user!.id;
    const {
      title,
      description,
      category,
      tags = [],
      images = [],
      liveUrl,
      githubUrl,
      technologies = [],
      startDate,
      endDate,
      isPublic = true,
      featured = false
    } = req.body;

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        userId,
        title,
        description,
        category,
        tags,
        images,
        liveUrl,
        githubUrl,
        technologies,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isPublic,
        featured
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio item created successfully',
      data: portfolioItem
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Update a portfolio item
export const updatePortfolioItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
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

    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    const portfolioItem = await prisma.portfolioItem.updateMany({
      where: {
        id,
        userId
      },
      data: updateData
    });

    if (portfolioItem.count === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Portfolio item not found'
      };
      res.status(404).json(response);
      return;
    }

    // Get the updated item
    const updatedItem = await prisma.portfolioItem.findUnique({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio item updated successfully',
      data: updatedItem
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete a portfolio item
export const deletePortfolioItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const portfolioItem = await prisma.portfolioItem.deleteMany({
      where: {
        id,
        userId
      }
    });

    if (portfolioItem.count === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Portfolio item not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio item deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get portfolio categories
export const getPortfolioCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.portfolioItem.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      where: {
        isPublic: true
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Categories retrieved successfully',
      data: categories.map(c => c.category)
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get public portfolio for a specific user (no authentication required)
export const getUserPublicPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { category, featured } = req.query;

    const where: any = {
      userId,
      isPublic: true,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    const portfolioItems = await prisma.portfolioItem.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Public portfolio retrieved successfully',
      data: portfolioItems
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get a single public portfolio item (no authentication required)
export const getPublicPortfolioItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const portfolioItem = await prisma.portfolioItem.findFirst({
      where: {
        id,
        isPublic: true,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    if (!portfolioItem) {
      const response: ApiResponse = {
        success: false,
        message: 'Portfolio item not found or not public'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Public portfolio item retrieved successfully',
      data: portfolioItem
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Browse all public portfolio items with pagination and filters
export const browsePublicPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      category, 
      tags, 
      technologies, 
      featured,
      search,
      page = '1', 
      limit = '12',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isPublic: true,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      where.tags = { hasSome: tagArray };
    }

    if (technologies) {
      const techArray = (technologies as string).split(',');
      where.technologies = { hasSome: techArray };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [items, total] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true
            }
          }
        }
      }),
      prisma.portfolioItem.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio items retrieved successfully',
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get featured portfolio items across platform
export const getFeaturedPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const items = await prisma.portfolioItem.findMany({
      where: {
        isPublic: true,
        isActive: true,
        featured: true
      },
      take: limitNum,
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Featured portfolio items retrieved successfully',
      data: items
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Search portfolio items
export const searchPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, category, page = '1', limit = '12' } = req.query;

    if (!q) {
      const response: ApiResponse = {
        success: false,
        message: 'Search query is required'
      };
      res.status(400).json(response);
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isPublic: true,
      isActive: true,
      OR: [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { category: { contains: q as string, mode: 'insensitive' } },
        { tags: { has: q as string } },
        { technologies: { has: q as string } }
      ]
    };

    if (category) {
      where.category = category;
    }

    const [items, total] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { viewCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      prisma.portfolioItem.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Search results retrieved successfully',
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Track portfolio item view
export const trackPortfolioView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Create view record
    await prisma.portfolioView.create({
      data: {
        portfolioItemId: id,
        userId,
        ipAddress,
        userAgent
      }
    });

    // Increment view count
    await prisma.portfolioItem.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'View tracked successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Toggle like on portfolio item
export const togglePortfolioLike = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if already liked
    const existingLike = await prisma.portfolioLike.findUnique({
      where: {
        portfolioItemId_userId: {
          portfolioItemId: id,
          userId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.portfolioLike.delete({
        where: {
          portfolioItemId_userId: {
            portfolioItemId: id,
            userId
          }
        }
      });

      await prisma.portfolioItem.update({
        where: { id },
        data: {
          likeCount: { decrement: 1 }
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Portfolio item unliked',
        data: { liked: false }
      };

      res.status(200).json(response);
    } else {
      // Like
      await prisma.portfolioLike.create({
        data: {
          portfolioItemId: id,
          userId
        }
      });

      await prisma.portfolioItem.update({
        where: { id },
        data: {
          likeCount: { increment: 1 }
        }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Portfolio item liked',
        data: { liked: true }
      };

      res.status(200).json(response);
    }
  } catch (error) {
    next(error);
  }
};

// Get portfolio statistics for user
export const getPortfolioStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [totalItems, totalViews, totalLikes, featuredItems] = await Promise.all([
      prisma.portfolioItem.count({ where: { userId, isActive: true } }),
      prisma.portfolioItem.aggregate({
        where: { userId, isActive: true },
        _sum: { viewCount: true }
      }),
      prisma.portfolioItem.aggregate({
        where: { userId, isActive: true },
        _sum: { likeCount: true }
      }),
      prisma.portfolioItem.count({ where: { userId, isActive: true, featured: true } })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio statistics retrieved successfully',
      data: {
        totalItems,
        totalViews: totalViews._sum.viewCount || 0,
        totalLikes: totalLikes._sum.likeCount || 0,
        featuredItems
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get statistics for a specific portfolio item
export const getPortfolioItemStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const portfolioItem = await prisma.portfolioItem.findFirst({
      where: { id, userId },
      select: {
        viewCount: true,
        likeCount: true,
        views: {
          select: {
            viewedAt: true
          },
          orderBy: { viewedAt: 'desc' },
          take: 30
        }
      }
    });

    if (!portfolioItem) {
      const response: ApiResponse = {
        success: false,
        message: 'Portfolio item not found'
      };
      res.status(404).json(response);
      return;
    }

    // Group views by date
    const viewsByDate = portfolioItem.views.reduce((acc: any, view) => {
      const date = view.viewedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio item statistics retrieved successfully',
      data: {
        viewCount: portfolioItem.viewCount,
        likeCount: portfolioItem.likeCount,
        viewsByDate
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Bulk update portfolio items
export const bulkUpdatePortfolio = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemIds, updates } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        message: 'Item IDs array is required'
      };
      res.status(400).json(response);
      return;
    }

    if (!updates || typeof updates !== 'object') {
      const response: ApiResponse = {
        success: false,
        message: 'Updates object is required'
      };
      res.status(400).json(response);
      return;
    }

    // Only allow certain fields to be bulk updated
    const allowedFields = ['isPublic', 'featured', 'isActive', 'category'];
    const sanitizedUpdates: any = {};
    
    for (const key of allowedFields) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const result = await prisma.portfolioItem.updateMany({
      where: {
        id: { in: itemIds },
        userId
      },
      data: sanitizedUpdates
    });

    const response: ApiResponse = {
      success: true,
      message: `${result.count} portfolio items updated successfully`,
      data: { updatedCount: result.count }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Reorder portfolio items
export const reorderPortfolio = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { itemOrders } = req.body;

    if (!itemOrders || !Array.isArray(itemOrders)) {
      const response: ApiResponse = {
        success: false,
        message: 'Item orders array is required (format: [{id: string, order: number}])'
      };
      res.status(400).json(response);
      return;
    }

    // Update each item's display order
    await Promise.all(
      itemOrders.map((item: { id: string; order: number }) =>
        prisma.portfolioItem.updateMany({
          where: {
            id: item.id,
            userId
          },
          data: {
            displayOrder: item.order
          }
        })
      )
    );

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio items reordered successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
