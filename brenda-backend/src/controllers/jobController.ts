import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// Validation rules for job creation
export const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .isIn(['FIXED', 'HOURLY', 'RANGE'])
    .withMessage('Budget type must be FIXED, HOURLY, or RANGE'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each skill must be between 2 and 50 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
];

export const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .optional()
    .isIn(['FIXED', 'HOURLY', 'RANGE'])
    .withMessage('Budget type must be FIXED, HOURLY, or RANGE'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('skills')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each skill must be between 2 and 50 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be OPEN, IN_PROGRESS, COMPLETED, or CANCELLED'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
];

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

// Get all jobs (public)
export const getAllJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      category, 
      skills, 
      location, 
      isRemote, 
      budgetMin, 
      budgetMax, 
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status: 'OPEN' };

    // Apply filters
    if (category) {
      where.category = category;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      where.skills = {
        hasSome: skillsArray
      };
    }

    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (isRemote !== undefined) {
      where.isRemote = isRemote === 'true';
    }

    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = Number(budgetMin);
      if (budgetMax) where.budget.lte = Number(budgetMax);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [jobs, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                company: {
                  select: {
                    companyName: true,
                    logo: true
                  }
                }
              }
            },
            _count: {
              select: {
                proposals: true
              }
            }
          }
        }),
        prisma.job.count({ where })
      ]);
    });

    const response: ApiResponse = {
      success: true,
      message: 'Jobs retrieved successfully',
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get today's jobs
export const getTodaysJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: {
              select: {
                companyName: true,
                logo: true
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Today\'s jobs retrieved successfully',
      data: jobs
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get a specific job
export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: {
              select: {
                companyName: true,
                logo: true,
                description: true
              }
            }
          }
        },
        proposals: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                profile: {
                  select: {
                    title: true,
                    hourlyRate: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    if (!job) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Job retrieved successfully',
      data: job
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get user's jobs (for clients)
export const getUserJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { ownerId: userId };

    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              proposals: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'User jobs retrieved successfully',
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Create a new job
export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Debug: Log the received data
    console.log('Received job data:', req.body);
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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
      budget,
      budgetType,
      duration,
      skills,
      category,
      subcategory,
      location,
      isRemote = false,
      deadline
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        budgetType,
        duration,
        skills,
        category,
        subcategory,
        location,
        isRemote,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: {
              select: {
                companyName: true,
                logo: true
              }
            }
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job created successfully',
      data: job
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Update a job
export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Convert deadline to Date if provided
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingJob) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found or you do not have permission to update it'
      };
      res.status(404).json(response);
      return;
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: {
              select: {
                companyName: true,
                logo: true
              }
            }
          }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job updated successfully',
      data: job
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete a job
export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingJob) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      };
      res.status(404).json(response);
      return;
    }

    await prisma.job.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job categories
export const getJobCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await withRetry(async () => {
      return await prisma.job.findMany({
        select: {
          category: true,
          subcategory: true
        },
        distinct: ['category'],
        where: {
          status: 'OPEN'
        }
      });
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job categories retrieved successfully',
      data: categories.map(c => ({
        category: c.category,
        subcategory: c.subcategory
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get popular skills
export const getPopularSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        skills: true
      },
      where: {
        status: 'OPEN'
      }
    });

    // Count skill occurrences
    const skillCounts: Record<string, number> = {};
    jobs.forEach(job => {
      job.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Sort by count and return top skills
    const popularSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    const response: ApiResponse = {
      success: true,
      message: 'Popular skills retrieved successfully',
      data: popularSkills
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
