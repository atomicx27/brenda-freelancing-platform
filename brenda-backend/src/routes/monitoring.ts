import express, { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// All monitoring routes require authentication
router.use(authenticate);

// ==================== AUTOMATION MONITORING ====================

// Get automation system health and stats
router.get('/health', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get counts and stats
    const [
      totalRules,
      activeRules,
      totalLogs,
      recentLogs,
      totalCampaigns,
      activeCampaigns
    ] = await Promise.all([
      prisma.automationRule.count({ where: { userId } }),
      prisma.automationRule.count({ where: { userId, isActive: true } }),
      prisma.automationLog.count({ where: { userId } }),
      prisma.automationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          rule: {
            select: { name: true, type: true }
          }
        }
      }),
      prisma.emailCampaign.count({ where: { userId } }),
      prisma.emailCampaign.count({
        where: { userId, status: { in: ['SCHEDULED', 'RUNNING'] } }
      })
    ]);

    // Calculate success rate from logs
    const successCount = await prisma.automationLog.count({
      where: { userId, status: 'SUCCESS' }
    });
    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;

    // Get rule performance
    const rulePerformance = await prisma.automationRule.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        runCount: true,
        successCount: true,
        errorCount: true,
        lastRun: true
      },
      orderBy: { runCount: 'desc' },
      take: 10
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRules,
          activeRules,
          totalExecutions: totalLogs,
          successRate: Math.round(successRate * 100) / 100,
          totalCampaigns,
          activeCampaigns
        },
        recentActivity: recentLogs,
        topRules: rulePerformance
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get automation logs with filtering
router.get('/logs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      ruleId,
      status,
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    const where: any = { userId };
    if (ruleId) where.ruleId = ruleId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          rule: {
            select: {
              id: true,
              name: true,
              type: true,
              trigger: true
            }
          }
        }
      }),
      prisma.automationLog.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        logs,
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
});

// Get rule execution metrics
router.get('/rules/:ruleId/metrics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { ruleId } = req.params;

    const rule = await prisma.automationRule.findFirst({
      where: { id: ruleId, userId }
    });

    if (!rule) {
      return res.status(404).json({
        status: 'error',
        message: 'Rule not found'
      });
    }

    // Get execution history
    const logs = await prisma.automationLog.findMany({
      where: { ruleId, userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate metrics
    const totalRuns = logs.length;
    const successRuns = logs.filter(l => l.status === 'SUCCESS').length;
    const failedRuns = logs.filter(l => l.status === 'FAILED').length;
    const avgDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0) / (totalRuns || 1);
    const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0;

    // Get recent errors
    const recentErrors = logs
      .filter(l => l.error)
      .slice(0, 5)
      .map(l => ({ message: l.error, timestamp: l.createdAt }));

    return res.status(200).json({
      status: 'success',
      data: {
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          trigger: rule.trigger,
          isActive: rule.isActive
        },
        metrics: {
          totalRuns,
          successRuns,
          failedRuns,
          successRate: Math.round(successRate * 100) / 100,
          avgDuration: Math.round(avgDuration),
          lastRun: rule.lastRun,
          nextRun: rule.nextRun
        },
        recentErrors
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Get email campaign analytics
router.get('/campaigns/:campaignId/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { campaignId } = req.params;

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, userId },
      include: {
        emails: {
          select: {
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            bouncedAt: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        status: 'error',
        message: 'Campaign not found'
      });
    }

    const totalSent = campaign.emails.filter(e => e.sentAt).length;
    const totalOpened = campaign.emails.filter(e => e.openedAt).length;
    const totalClicked = campaign.emails.filter(e => e.clickedAt).length;
    const totalBounced = campaign.emails.filter(e => e.bouncedAt).length;

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          scheduledAt: campaign.scheduledAt,
          sentAt: campaign.sentAt
        },
        analytics: {
          totalSent,
          totalOpened,
          totalClicked,
          totalBounced,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
