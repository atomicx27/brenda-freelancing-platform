import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { body, validationResult } from 'express-validator';

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

// Validation rules for creating a review
export const createReviewValidation = [
  body('receiverId')
    .isString()
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  body('jobId')
    .optional()
    .isString()
    .withMessage('Job ID must be a valid string')
];

// Create a new review
export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { receiverId, rating, comment, jobId } = req.body;
    const authorId = req.user!.id;

    // Check if user is trying to review themselves
    if (authorId === receiverId) {
      res.status(400).json({
        success: false,
        message: 'You cannot review yourself'
      });
      return;
    }

    // Check if user has already reviewed this person for this job
    const existingReview = await withRetry(async () => {
      return await prisma.review.findFirst({
        where: {
          authorId,
          receiverId,
          jobId: jobId || null
        }
      });
    });

    if (existingReview) {
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this user for this job'
      });
      return;
    }

    // Verify that the receiver exists
    const receiver = await withRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, firstName: true, lastName: true }
      });
    });

    if (!receiver) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // If jobId is provided, verify the job exists and user was involved
    if (jobId) {
      const job = await withRetry(async () => {
        return await prisma.job.findUnique({
          where: { id: jobId },
          include: {
            owner: true,
            proposals: {
              where: { authorId }
            }
          }
        });
      });

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found'
        });
        return;
      }

      // Check if user was involved in this job (either as owner or as freelancer with accepted proposal)
      const isJobOwner = job.ownerId === authorId;
      const hasAcceptedProposal = job.proposals.some((proposal: any) => 
        proposal.authorId === authorId && proposal.status === 'ACCEPTED'
      );

      if (!isJobOwner && !hasAcceptedProposal) {
        res.status(403).json({
          success: false,
          message: 'You can only review users you have worked with on this job'
        });
        return;
      }
    }

    // Create the review
    const review = await withRetry(async () => {
      return await prisma.review.create({
        data: {
          authorId,
          receiverId,
          rating,
          comment: comment || null,
          jobId: jobId || null
        },
        include: {
          author: {
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
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific user
export const getUserReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { receiverId: userId };

    if (rating) {
      where.rating = Number(rating);
    }

    const [reviews, total, stats] = await withRetry(async () => {
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
                avatar: true,
                company: {
                  select: {
                    companyName: true,
                    logo: true
                  }
                }
              }
            },
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.review.count({ where }),
        prisma.review.aggregate({
          where: { receiverId: userId },
          _avg: { rating: true },
          _count: { rating: true }
        })
      ]);
    });

    const response = {
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        statistics: {
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count.rating || 0,
          ratingDistribution: await getRatingDistribution(userId)
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get rating distribution for a user
const getRatingDistribution = async (userId: string) => {
  const distribution = await withRetry(async () => {
    return await prisma.review.groupBy({
      by: ['rating'],
      where: { receiverId: userId },
      _count: { rating: true }
    });
  });

  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((item: any) => {
    result[item.rating as keyof typeof result] = item._count.rating;
  });

  return result;
};

// Get user's own reviews (reviews they've written)
export const getUserAuthoredReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.review.findMany({
          where: { authorId: userId },
          skip,
          take: Number(limit),
          include: {
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.review.count({ where: { authorId: userId } })
      ]);
    });

    res.json({
      success: true,
      message: 'Authored reviews retrieved successfully',
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a review (only by the author)
export const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.id;

    // Find the review
    const review = await withRetry(async () => {
      return await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          author: true
        }
      });
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check if user is the author
    if (review.authorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
      return;
    }

    // Update the review
    const updatedReview = await withRetry(async () => {
      return await prisma.review.update({
        where: { id: reviewId },
        data: {
          rating: rating || review.rating,
          comment: comment !== undefined ? comment : review.comment
        },
        include: {
          author: {
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
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review (only by the author)
export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.id;

    // Find the review
    const review = await withRetry(async () => {
      return await prisma.review.findUnique({
        where: { id: reviewId }
      });
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // Check if user is the author
    if (review.authorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
      return;
    }

    // Delete the review
    await withRetry(async () => {
      return await prisma.review.delete({
        where: { id: reviewId }
      });
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get recent reviews (for homepage/feed)
export const getRecentReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const reviews = await withRetry(async () => {
      return await prisma.review.findMany({
        take: Number(limit),
        include: {
          author: {
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
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    res.json({
      success: true,
      message: 'Recent reviews retrieved successfully',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Report a review (for moderation)
export const reportReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user!.id;

    // Check if review exists
    const review = await withRetry(async () => {
      return await prisma.review.findUnique({
        where: { id: reviewId }
      });
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found'
      });
      return;
    }

    // For now, we'll just log the report without checking for duplicates
    // TODO: Implement ReviewReport model in the future

    // Create report (if ReviewReport model exists)
    // For now, we'll just log it and return success
    console.log(`Review ${reviewId} reported by user ${userId}. Reason: ${reason}, Description: ${description}`);

    res.json({
      success: true,
      message: 'Review reported successfully. Our moderation team will review it.'
    });
  } catch (error) {
    next(error);
  }
};
