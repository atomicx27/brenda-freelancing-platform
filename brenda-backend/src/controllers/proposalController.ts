import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { autoGenerateContractOnProposalAcceptance } from '../services/automationService';

// Validation rules for proposal creation
export const createProposalValidation = [
  body('jobId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Job ID is required'),
  body('coverLetter')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Cover letter must be between 50 and 2000 characters'),
  body('proposedRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed rate must be a positive number'),
  body('estimatedDuration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Estimated duration must be less than 100 characters')
];

export const updateProposalValidation = [
  body('coverLetter')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Cover letter must be between 50 and 2000 characters'),
  body('proposedRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed rate must be a positive number'),
  body('estimatedDuration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Estimated duration must be less than 100 characters'),
  body('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    .withMessage('Status must be PENDING, ACCEPTED, REJECTED, or WITHDRAWN')
];

// Create a new proposal
export const createProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    const { jobId, coverLetter, proposedRate, estimatedDuration } = req.body;

    // Check if user is a freelancer
    if (req.user!.userType !== 'FREELANCER') {
      const response: ApiResponse = {
        success: false,
        message: 'Only freelancers can submit proposals'
      };
      res.status(403).json(response);
      return;
    }

    // Ensure freelancer has uploaded a resume
    const freelancerProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        resumeUrl: true
      }
    });

    if (!freelancerProfile?.resumeUrl) {
      const response: ApiResponse = {
        success: false,
        message: 'You must upload a resume before submitting a proposal.'
      };
      res.status(400).json(response);
      return;
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { owner: true }
    });

    if (!job) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    if (job.status !== 'OPEN') {
      const response: ApiResponse = {
        success: false,
        message: 'This job is no longer accepting proposals'
      };
      res.status(400).json(response);
      return;
    }

    // Check if user is trying to apply to their own job
    if (job.ownerId === userId) {
      const response: ApiResponse = {
        success: false,
        message: 'You cannot apply to your own job'
      };
      res.status(400).json(response);
      return;
    }

    // Check if user has already applied to this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        jobId,
        authorId: userId
      }
    });

    if (existingProposal) {
      const response: ApiResponse = {
        success: false,
        message: 'You have already submitted a proposal for this job'
      };
      res.status(400).json(response);
      return;
    }

    // Create proposal
    const proposal = await prisma.proposal.create({
      data: {
        jobId,
        authorId: userId,
        coverLetter,
        proposedRate,
        estimatedDuration
      },
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
                hourlyRate: true,
                skills: true
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            budgetType: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Get proposals for a specific job (for job owners)
export const getJobProposals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Check if job exists and belongs to user
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        ownerId: userId
      }
    });

    if (!job) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found or you do not have permission to view its proposals'
      };
      res.status(404).json(response);
      return;
    }

    const proposals = await prisma.proposal.findMany({
      where: { jobId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            location: true,
            profile: {
              select: {
                title: true,
                hourlyRate: true,
                skills: true,
                experience: true,
                availability: true
              }
            },
            portfolio: {
              where: { isPublic: true },
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                images: true,
                liveUrl: true,
                githubUrl: true,
                technologies: true,
                featured: true
              },
              take: 3,
              orderBy: { featured: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Proposals retrieved successfully',
      data: proposals
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

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

// Get user's proposals (for freelancers)
export const getUserProposals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { authorId: userId };

    if (status) {
      where.status = status;
    }

    const [proposals, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.proposal.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            job: {
              select: {
                id: true,
                title: true,
                description: true,
                budget: true,
                budgetType: true,
                duration: true,
                category: true,
                location: true,
                isRemote: true,
                status: true,
                createdAt: true,
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
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.proposal.count({ where })
      ]);
    });

    const response: ApiResponse = {
      success: true,
      message: 'User proposals retrieved successfully',
      data: {
        proposals,
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

// Get a specific proposal
export const getProposalById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            location: true,
            profile: {
              select: {
                title: true,
                hourlyRate: true,
                skills: true,
                experience: true,
                availability: true
              }
            },
            portfolio: {
              where: { isPublic: true },
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                images: true,
                liveUrl: true,
                githubUrl: true,
                technologies: true,
                featured: true
              },
              orderBy: { featured: 'desc' }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            budgetType: true,
            duration: true,
            category: true,
            location: true,
            isRemote: true,
            status: true,
            createdAt: true,
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
        }
      }
    });

    if (!proposal) {
      const response: ApiResponse = {
        success: false,
        message: 'Proposal not found'
      };
      res.status(404).json(response);
      return;
    }

    // Check if user has permission to view this proposal
    const canView = proposal.authorId === userId || proposal.job.owner.id === userId;
    if (!canView) {
      const response: ApiResponse = {
        success: false,
        message: 'You do not have permission to view this proposal'
      };
      res.status(403).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Proposal retrieved successfully',
      data: proposal
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update proposal status (for job owners)
export const updateProposalStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status } = req.body;

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            ownerId: true,
            title: true
          }
        }
      }
    });

    if (!proposal) {
      const response: ApiResponse = {
        success: false,
        message: 'Proposal not found'
      };
      res.status(404).json(response);
      return;
    }

    // Check if user is the job owner
    if (proposal.job.ownerId !== userId) {
      const response: ApiResponse = {
        success: false,
        message: 'You do not have permission to update this proposal'
      };
      res.status(403).json(response);
      return;
    }

    // Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { status },
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
        },
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            budgetType: true
          }
        }
      }
    });

    // 🤖 AUTOMATION TRIGGER: Auto-generate contract when proposal is accepted
    if (status === 'ACCEPTED') {
      try {
        await autoGenerateContractOnProposalAcceptance(id);
        console.log(`✅ [Automation] Contract auto-generated for accepted proposal ${id}`);
      } catch (autoError: any) {
        console.error(`⚠️ [Automation] Failed to auto-generate contract:`, autoError.message);
        // Don't fail the proposal acceptance if contract generation fails
        // The contract can be created manually later
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Proposal ${status.toLowerCase()} successfully`,
      data: updatedProposal
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update proposal (for freelancers)
export const updateProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Check if proposal exists and belongs to user
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!existingProposal) {
      const response: ApiResponse = {
        success: false,
        message: 'Proposal not found or you do not have permission to update it'
      };
      res.status(404).json(response);
      return;
    }

    // Don't allow updating if proposal is already accepted or rejected
    if (existingProposal.status === 'ACCEPTED' || existingProposal.status === 'REJECTED') {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot update proposal that has been accepted or rejected'
      };
      res.status(400).json(response);
      return;
    }

    // Update proposal
    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
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
        },
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            budgetType: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Proposal updated successfully',
      data: proposal
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete/withdraw proposal (for freelancers)
export const deleteProposal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if proposal exists and belongs to user
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        id,
        authorId: userId
      }
    });

    if (!existingProposal) {
      const response: ApiResponse = {
        success: false,
        message: 'Proposal not found or you do not have permission to delete it'
      };
      res.status(404).json(response);
      return;
    }

    // Don't allow deleting if proposal is already accepted
    if (existingProposal.status === 'ACCEPTED') {
      const response: ApiResponse = {
        success: false,
        message: 'Cannot delete proposal that has been accepted'
      };
      res.status(400).json(response);
      return;
    }

    // Delete proposal
    await prisma.proposal.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Proposal withdrawn successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get proposal statistics for a user
export const getProposalStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const stats = await prisma.proposal.aggregate({
      where: { authorId: userId },
      _count: { id: true },
      _avg: { proposedRate: true }
    });

    const statusCounts = await prisma.proposal.groupBy({
      by: ['status'],
      where: { authorId: userId },
      _count: { id: true }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Proposal statistics retrieved successfully',
      data: {
        totalProposals: stats._count.id,
        averageRate: stats._avg.proposedRate,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
