import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// Validation rules for profile update
export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

// Get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      firstName,
      lastName,
      bio,
      location,
      website,
      phone,
      linkedin,
      github,
      twitter,
      // Profile specific fields
      title,
      company,
      experience,
      hourlyRate,
      availability,
      skills,
      languages
    } = req.body;

    // Update user basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(phone !== undefined && { phone }),
        ...(linkedin !== undefined && { linkedin }),
        ...(github !== undefined && { github }),
        ...(twitter !== undefined && { twitter })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
        twitter: true,
        updatedAt: true
      }
    });

    // Update profile if user is a freelancer and profile fields are provided
    if (req.user!.userType === 'FREELANCER' && (title || company || experience || hourlyRate || availability || skills || languages)) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...(title !== undefined && { title }),
          ...(company !== undefined && { company }),
          ...(experience !== undefined && { experience }),
          ...(hourlyRate !== undefined && { hourlyRate }),
          ...(availability !== undefined && { availability }),
          ...(skills !== undefined && { skills }),
          ...(languages !== undefined && { languages })
        },
        create: {
          userId,
          ...(title && { title }),
          ...(company && { company }),
          ...(experience && { experience }),
          ...(hourlyRate && { hourlyRate }),
          ...(availability && { availability }),
          ...(skills && { skills }),
          ...(languages && { languages })
        }
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get potential mentors
export const getPotentialMentors = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, skills, limit = 20 } = req.query;
    const currentUserId = req.user!.id;

    const where: any = {
      id: { not: currentUserId }, // Exclude current user
      isActive: true,
      // Only show users who have APPROVED mentor applications
      mentorApplication: {
        status: 'APPROVED'
      }
    };

    // If search term provided, search by name or profile title
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { profile: { title: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const mentors = await prisma.user.findMany({
      where,
      take: Number(limit),
      orderBy: [
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        profile: {
          select: {
            title: true,
            skills: true,
            experience: true,
            hourlyRate: true
          }
        },
        mentorApplication: {
          select: {
            expertise: true,
            experience: true,
            achievements: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Mentors retrieved successfully',
      data: { mentors }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
