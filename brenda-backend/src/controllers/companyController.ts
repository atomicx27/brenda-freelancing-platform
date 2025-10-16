import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// Validation rules for company profile
export const createCompanyValidation = [
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('tagline')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tagline must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Website must be a valid URL'),
  body('email')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('Email must be a valid email address'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return value.length >= 10 && value.length <= 20;
    })
    .withMessage('Please provide a valid phone number'),
  body('foundedYear')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true;
      const year = parseInt(value);
      return !isNaN(year) && year >= 1800 && year <= new Date().getFullYear();
    })
    .withMessage('Founded year must be a valid year'),
  body('linkedin')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('LinkedIn must be a valid URL'),
  body('twitter')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Twitter must be a valid URL'),
  body('facebook')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Facebook must be a valid URL'),
  body('instagram')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Instagram must be a valid URL')
];

export const updateCompanyValidation = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('tagline')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tagline must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('website')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Website must be a valid URL'),
  body('email')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('Email must be a valid email address'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return value.length >= 10 && value.length <= 20;
    })
    .withMessage('Please provide a valid phone number'),
  body('foundedYear')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true;
      const year = parseInt(value);
      return !isNaN(year) && year >= 1800 && year <= new Date().getFullYear();
    })
    .withMessage('Founded year must be a valid year'),
  body('linkedin')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('LinkedIn must be a valid URL'),
  body('twitter')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Twitter must be a valid URL'),
  body('facebook')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Facebook must be a valid URL'),
  body('instagram')
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      return /^https?:\/\/.+/.test(value);
    })
    .withMessage('Instagram must be a valid URL')
];

// Get company profile
export const getCompanyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    let companyProfile = await prisma.companyProfile.findUnique({
      where: { userId }
    });

    // If no company profile exists, create a basic one
    if (!companyProfile) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      });

      companyProfile = await prisma.companyProfile.create({
        data: {
          userId,
          companyName: `${user?.firstName} ${user?.lastName}'s Company`
        }
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Company profile retrieved successfully',
      data: companyProfile
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update company profile
export const updateCompanyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
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
    const updateData = req.body;

    // Process data to ensure correct types
    if (updateData.foundedYear && typeof updateData.foundedYear === 'string') {
      updateData.foundedYear = parseInt(updateData.foundedYear);
    }

    console.log('Processed update data:', updateData);

    // Upsert company profile (create if doesn't exist, update if exists)
    const companyProfile = await prisma.companyProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Company profile updated successfully',
      data: companyProfile
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get public company profiles
export const getPublicCompanyProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { industry, companySize, search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { isPublic: true };

    if (industry) {
      where.industry = industry;
    }

    if (companySize) {
      where.companySize = companySize;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { tagline: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [companyProfiles, total] = await Promise.all([
      prisma.companyProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }),
      prisma.companyProfile.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Company profiles retrieved successfully',
      data: {
        profiles: companyProfiles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get company profile by ID (public)
export const getCompanyProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const companyProfile = await prisma.companyProfile.findFirst({
      where: {
        id,
        isPublic: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    if (!companyProfile) {
      const response: ApiResponse = {
        success: false,
        message: 'Company profile not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Company profile retrieved successfully',
      data: companyProfile
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get company statistics
export const getCompanyStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId }
    });

    if (!companyProfile) {
      const response: ApiResponse = {
        success: false,
        message: 'Company profile not found'
      };
      res.status(404).json(response);
      return;
    }

    // Get job statistics
    const jobStats = await prisma.job.aggregate({
      where: { ownerId: userId },
      _count: { id: true },
      _sum: { budget: true }
    });

    const activeJobs = await prisma.job.count({
      where: {
        ownerId: userId,
        status: 'OPEN'
      }
    });

    const stats = {
      totalProjects: jobStats._count.id,
      activeProjects: activeJobs,
      totalSpent: jobStats._sum.budget || 0,
      avgProjectValue: jobStats._count.id > 0 ? (jobStats._sum.budget || 0) / jobStats._count.id : 0
    };

    // Update company profile with latest stats
    await prisma.companyProfile.update({
      where: { userId },
      data: stats
    });

    const response: ApiResponse = {
      success: true,
      message: 'Company statistics retrieved successfully',
      data: stats
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get company industries
export const getCompanyIndustries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const industries = await prisma.companyProfile.findMany({
      select: { industry: true },
      distinct: ['industry'],
      where: {
        isPublic: true,
        industry: { not: null }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Industries retrieved successfully',
      data: industries.map(c => c.industry).filter(Boolean)
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
