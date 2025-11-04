import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { createError } from '../middleware/errorHandler';

// Helper function for retrying database operations
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      if (error.code === 'P2024' || error.code === 'P2034') {
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

// Submit mentor application
export const submitMentorApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      expertise,
      experience,
      motivation,
      availability,
      linkedinUrl,
      portfolioUrl,
      achievements
    } = req.body;

    // Validation
    if (!expertise || !Array.isArray(expertise) || expertise.length === 0) {
      throw createError('Please provide at least one area of expertise', 400);
    }

    if (!experience || experience < 0) {
      throw createError('Please provide valid years of experience', 400);
    }

    if (!motivation || motivation.trim().length < 50) {
      throw createError('Please provide a detailed motivation (minimum 50 characters)', 400);
    }

    if (!availability) {
      throw createError('Please specify your availability', 400);
    }

    // Check if user already has an application
    const existingApplication = await prisma.mentorApplication.findUnique({
      where: { userId }
    });

    if (existingApplication) {
      if (existingApplication.status === 'PENDING') {
        throw createError('You already have a pending application', 400);
      }
      if (existingApplication.status === 'APPROVED') {
        throw createError('Your mentor application has already been approved', 400);
      }
      // If rejected, allow reapplication by updating the existing one
    }

    const applicationData = {
      userId,
      expertise,
      experience: Number(experience),
      motivation,
      availability,
      linkedinUrl: linkedinUrl || null,
      portfolioUrl: portfolioUrl || null,
      achievements: achievements || null,
      status: 'PENDING' as const
    };

    const application = existingApplication
      ? await withRetry(() =>
          prisma.mentorApplication.update({
            where: { id: existingApplication.id },
            data: {
              ...applicationData,
              reviewedBy: null,
              reviewedAt: null,
              adminNotes: null
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          })
        )
      : await withRetry(() =>
          prisma.mentorApplication.create({
            data: applicationData,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          })
        );

    res.status(201).json({
      status: 'success',
      message: 'Mentor application submitted successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's mentor application
export const getMyMentorApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const application = await prisma.mentorApplication.findUnique({
      where: { userId },
      include: {
        user: {
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
                experience: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all mentor applications
export const getAllMentorApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await withRetry(async () => {
      return Promise.all([
        prisma.mentorApplication.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: order },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                createdAt: true,
                profile: {
                  select: {
                    title: true,
                    skills: true,
                    experience: true,
                    hourlyRate: true
                  }
                },
                mentorshipAsMentor: {
                  select: {
                    id: true,
                    status: true
                  }
                }
              }
            }
          }
        }),
        prisma.mentorApplication.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        applications,
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

// Admin: Get single application details
export const getMentorApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.mentorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phone: true,
            location: true,
            linkedin: true,
            github: true,
            createdAt: true,
            lastLoginAt: true,
            profile: {
              select: {
                title: true,
                company: true,
                skills: true,
                experience: true,
                hourlyRate: true,
                languages: true
              }
            },
            portfolio: {
              select: {
                id: true,
                title: true,
                category: true,
                images: true
              },
              take: 5
            },
            mentorshipAsMentor: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true
              }
            },
            receivedReviews: {
              select: {
                rating: true,
                comment: true,
                createdAt: true
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!application) {
      throw createError('Application not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Approve mentor application
export const approveMentorApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user!.id;

    const application = await prisma.mentorApplication.findUnique({
      where: { id }
    });

    if (!application) {
      throw createError('Application not found', 404);
    }

    if (application.status !== 'PENDING') {
      throw createError('Only pending applications can be approved', 400);
    }

    const updatedApplication = await withRetry(() =>
      prisma.mentorApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: adminNotes || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        }
      })
    );

    // TODO: Send email notification to user
    // TODO: Create notification in app

    res.status(200).json({
      status: 'success',
      message: 'Mentor application approved successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Reject mentor application
export const rejectMentorApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user!.id;

    const application = await prisma.mentorApplication.findUnique({
      where: { id }
    });

    if (!application) {
      throw createError('Application not found', 404);
    }

    if (application.status !== 'PENDING') {
      throw createError('Only pending applications can be rejected', 400);
    }

    if (!adminNotes || adminNotes.trim().length < 10) {
      throw createError('Please provide a reason for rejection (minimum 10 characters)', 400);
    }

    const updatedApplication = await withRetry(() =>
      prisma.mentorApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        }
      })
    );

    // TODO: Send email notification to user with reason
    // TODO: Create notification in app

    res.status(200).json({
      status: 'success',
      message: 'Mentor application rejected',
      data: { application: updatedApplication }
    });
  } catch (error) {
    next(error);
  }
};
