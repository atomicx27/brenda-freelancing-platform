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
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('githubUrl')
    .optional()
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
    .optional()
    .isURL()
    .withMessage('Live URL must be a valid URL'),
  body('githubUrl')
    .optional()
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
