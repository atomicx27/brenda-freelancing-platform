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

// Get freelancer analytics
export const getFreelancerAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    const [
      proposalStats,
      jobStats,
      reviewStats,
      earningsData,
      categoryStats,
      recentActivity
    ] = await withRetry(async () => {
      return await Promise.all([
        // Proposal statistics
        prisma.proposal.aggregate({
          where: {
            authorId: userId,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { proposedRate: true }
        }),

        // Job statistics (jobs where proposals were accepted)
        prisma.proposal.findMany({
          where: {
            authorId: userId,
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          },
          include: {
            job: {
              select: {
                budget: true,
                budgetType: true,
                category: true,
                createdAt: true
              }
            }
          }
        }),

        // Review statistics
        prisma.review.aggregate({
          where: {
            receiverId: userId,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { rating: true }
        }),

        // Earnings data (simulated - in real app this would come from payment system)
        prisma.proposal.findMany({
          where: {
            authorId: userId,
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          },
          select: {
            proposedRate: true,
            job: {
              select: {
                budget: true,
                budgetType: true,
                createdAt: true
              }
            }
          }
        }),

        // Category performance
        prisma.proposal.groupBy({
          by: ['jobId'],
          where: {
            authorId: userId,
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Recent activity
        prisma.proposal.findMany({
          where: {
            authorId: userId,
            createdAt: { gte: startDate }
          },
          include: {
            job: {
              select: {
                title: true,
                category: true,
                budget: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);
    });

    // Calculate earnings
    const totalEarnings = earningsData.reduce((sum, proposal) => {
      const rate = proposal.proposedRate || proposal.job.budget || 0;
      return sum + rate;
    }, 0);

    // Calculate category performance
    const categoryPerformance = await withRetry(async () => {
      const categories = await prisma.job.groupBy({
        by: ['category'],
        where: {
          proposals: {
            some: {
              authorId: userId,
              status: 'ACCEPTED',
              createdAt: { gte: startDate }
            }
          }
        },
        _count: { id: true }
      });

      return categories.map(cat => ({
        category: cat.category,
        jobs: cat._count.id
      }));
    });

    // Calculate monthly earnings trend
    const monthlyEarnings = await withRetry(async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthEarnings = await prisma.proposal.aggregate({
          where: {
            authorId: userId,
            status: 'ACCEPTED',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: { proposedRate: true }
        });

        months.push({
          month: monthStart.toISOString().slice(0, 7),
          earnings: monthEarnings._sum.proposedRate || 0
        });
      }
      return months;
    });

    res.json({
      success: true,
      message: 'Freelancer analytics retrieved successfully',
      data: {
        period,
        overview: {
          totalProposals: proposalStats._count.id,
          acceptedJobs: jobStats.length,
          averageRating: reviewStats._avg.rating || 0,
          totalReviews: reviewStats._count.id,
          totalEarnings,
          averageProposalRate: proposalStats._avg.proposedRate || 0
        },
        earnings: {
          total: totalEarnings,
          monthlyTrend: monthlyEarnings,
          averagePerJob: jobStats.length > 0 ? totalEarnings / jobStats.length : 0
        },
        performance: {
          acceptanceRate: proposalStats._count.id > 0 ? (jobStats.length / proposalStats._count.id) * 100 : 0,
          categoryPerformance,
          topCategories: categoryPerformance.slice(0, 5)
        },
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          jobTitle: activity.job.title,
          category: activity.job.category,
          status: activity.status,
          proposedRate: activity.proposedRate,
          createdAt: activity.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get client analytics
export const getClientAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    const [
      jobStats,
      proposalStats,
      spendingData,
      freelancerStats,
      categoryStats
    ] = await withRetry(async () => {
      return await Promise.all([
        // Job statistics
        prisma.job.aggregate({
          where: {
            ownerId: userId,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { budget: true }
        }),

        // Proposal statistics
        prisma.proposal.findMany({
          where: {
            job: {
              ownerId: userId
            },
            createdAt: { gte: startDate }
          },
          include: {
            job: {
              select: {
                budget: true,
                budgetType: true,
                category: true
              }
            }
          }
        }),

        // Spending data (accepted proposals)
        prisma.proposal.findMany({
          where: {
            job: {
              ownerId: userId
            },
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          },
          include: {
            job: {
              select: {
                budget: true,
                budgetType: true,
                createdAt: true
              }
            }
          }
        }),

        // Freelancer statistics
        prisma.proposal.groupBy({
          by: ['authorId'],
          where: {
            job: {
              ownerId: userId
            },
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Category statistics
        prisma.job.groupBy({
          by: ['category'],
          where: {
            ownerId: userId,
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { budget: true }
        })
      ]);
    });

    // Calculate total spending
    const totalSpending = spendingData.reduce((sum, proposal) => {
      const rate = proposal.proposedRate || proposal.job.budget || 0;
      return sum + rate;
    }, 0);

    // Calculate monthly spending trend
    const monthlySpending = await withRetry(async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthSpending = await prisma.proposal.aggregate({
          where: {
            job: {
              ownerId: userId
            },
            status: 'ACCEPTED',
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _sum: { proposedRate: true }
        });

        months.push({
          month: monthStart.toISOString().slice(0, 7),
          spending: monthSpending._sum.proposedRate || 0
        });
      }
      return months;
    });

    // Get recent jobs
    const recentJobs = await withRetry(async () => {
      return await prisma.job.findMany({
        where: {
          ownerId: userId,
          createdAt: { gte: startDate }
        },
        include: {
          _count: {
            select: {
              proposals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    });

    res.json({
      success: true,
      message: 'Client analytics retrieved successfully',
      data: {
        period,
        overview: {
          totalJobsPosted: jobStats._count.id,
          totalProposals: proposalStats.length,
          totalSpending,
          averageJobBudget: jobStats._avg.budget || 0,
          uniqueFreelancers: freelancerStats.length
        },
        spending: {
          total: totalSpending,
          monthlyTrend: monthlySpending,
          averagePerJob: jobStats._count.id > 0 ? totalSpending / jobStats._count.id : 0
        },
        performance: {
          averageProposalsPerJob: jobStats._count.id > 0 ? proposalStats.length / jobStats._count.id : 0,
          categoryBreakdown: categoryStats.map(cat => ({
            category: cat.category,
            jobs: cat._count.id,
            averageBudget: cat._avg.budget || 0
          }))
        },
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          title: job.title,
          category: job.category,
          budget: job.budget,
          status: job.status,
          proposalCount: job._count.proposals,
          createdAt: job.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get admin analytics
export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user!.userType !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    const [
      userStats,
      jobStats,
      proposalStats,
      reviewStats,
      categoryStats,
      recentActivity
    ] = await withRetry(async () => {
      return await Promise.all([
        // User statistics
        prisma.user.aggregate({
          where: {
            createdAt: { gte: startDate }
          },
          _count: { id: true }
        }),

        // Job statistics
        prisma.job.aggregate({
          where: {
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { budget: true }
        }),

        // Proposal statistics
        prisma.proposal.aggregate({
          where: {
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { proposedRate: true }
        }),

        // Review statistics
        prisma.review.aggregate({
          where: {
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { rating: true }
        }),

        // Category statistics
        prisma.job.groupBy({
          by: ['category'],
          where: {
            createdAt: { gte: startDate }
          },
          _count: { id: true },
          _avg: { budget: true }
        }),

        // Recent activity
        prisma.job.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            _count: {
              select: {
                proposals: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);
    });

    // Get user type breakdown
    const userTypeBreakdown = await withRetry(async () => {
      return await prisma.user.groupBy({
        by: ['userType'],
        _count: { id: true }
      });
    });

    // Get monthly trends
    const monthlyTrends = await withRetry(async () => {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const [users, jobs, proposals] = await Promise.all([
          prisma.user.count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd
              }
            }
          }),
          prisma.job.count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd
              }
            }
          }),
          prisma.proposal.count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd
              }
            }
          })
        ]);

        months.push({
          month: monthStart.toISOString().slice(0, 7),
          users,
          jobs,
          proposals
        });
      }
      return months;
    });

    res.json({
      success: true,
      message: 'Admin analytics retrieved successfully',
      data: {
        period,
        overview: {
          totalUsers: userStats._count.id,
          totalJobs: jobStats._count.id,
          totalProposals: proposalStats._count.id,
          totalReviews: reviewStats._count.id,
          averageJobBudget: jobStats._avg.budget || 0,
          averageProposalRate: proposalStats._avg.proposedRate || 0,
          averageRating: reviewStats._avg.rating || 0
        },
        userBreakdown: {
          byType: userTypeBreakdown.map(type => ({
            type: type.userType,
            count: type._count.id
          }))
        },
        categoryBreakdown: categoryStats.map(cat => ({
          category: cat.category,
          jobs: cat._count.id,
          averageBudget: cat._avg.budget || 0
        })),
        trends: {
          monthly: monthlyTrends
        },
        recentActivity: recentActivity.map(job => ({
          id: job.id,
          title: job.title,
          category: job.category,
          budget: job.budget,
          owner: `${job.owner.firstName} ${job.owner.lastName}`,
          proposalCount: job._count.proposals,
          createdAt: job.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get platform health metrics
export const getPlatformHealth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user!.userType !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const [
      activeUsers,
      newJobs,
      newProposals,
      systemHealth
    ] = await withRetry(async () => {
      return await Promise.all([
        // Active users (users who logged in within last 7 days)
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: last7Days
            }
          }
        }),

        // New jobs in last 24 hours
        prisma.job.count({
          where: {
            createdAt: {
              gte: last24Hours
            }
          }
        }),

        // New proposals in last 24 hours
        prisma.proposal.count({
          where: {
            createdAt: {
              gte: last24Hours
            }
          }
        }),

        // System health check
        prisma.$queryRaw`SELECT 1 as health`
      ]);
    });

    res.json({
      success: true,
      message: 'Platform health retrieved successfully',
      data: {
        timestamp: now.toISOString(),
        metrics: {
          activeUsers,
          newJobs24h: newJobs,
          newProposals24h: newProposals,
          databaseHealth: systemHealth ? 'healthy' : 'unhealthy'
        },
        status: 'operational'
      }
    });
  } catch (error) {
    next(error);
  }
};
