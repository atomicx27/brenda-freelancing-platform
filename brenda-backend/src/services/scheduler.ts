import prisma from '../utils/prisma';
import { executeAutomationActions } from '../controllers/automationController';
import { sendEmail } from './emailService';

// Lightweight retry helper
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      await new Promise(res => setTimeout(res, 500 * attempt));
    }
  }
  throw new Error('unreachable');
};

// Compute next run based on rule conditions (supports conditions.intervalMinutes)
const computeNextRun = (rule: any): Date => {
  const intervalMinutes = Number(rule?.conditions?.intervalMinutes || 1440); // default daily
  const base = new Date();
  return new Date(base.getTime() + intervalMinutes * 60 * 1000);
};

async function runScheduledRules() {
  const now = new Date();
  const dueRules = await withRetry(() =>
    prisma.automationRule.findMany({
      where: {
        trigger: 'SCHEDULED' as any,
        isActive: true,
        OR: [
          { nextRun: null },
          { nextRun: { lte: now } }
        ]
      }
    })
  );

  for (const rule of dueRules) {
    const start = Date.now();
    let status: any = 'SUCCESS';
    let message = 'Automation executed successfully';
    let error: string | null = null;

    try {
      await executeAutomationActions(rule);
      await withRetry(() =>
        prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRun: new Date(),
            nextRun: computeNextRun(rule),
            runCount: { increment: 1 },
            successCount: { increment: 1 }
          }
        })
      );
    } catch (e: any) {
      status = 'FAILED';
      message = 'Automation execution failed';
      error = e?.message || 'Unknown error';
      await withRetry(() =>
        prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRun: new Date(),
            nextRun: computeNextRun(rule),
            runCount: { increment: 1 },
            errorCount: { increment: 1 }
          }
        })
      );
    }

    const duration = Date.now() - start;
    await withRetry(() =>
      prisma.automationLog.create({
        data: {
          ruleId: rule.id,
          userId: rule.userId,
          status,
          message,
          error,
          duration
        }
      })
    );
  }
}

async function runScheduledEmailCampaigns() {
  const now = new Date();
  const campaigns = await withRetry(() =>
    prisma.emailCampaign.findMany({
      where: { status: 'SCHEDULED' as any, scheduledAt: { lte: now } },
      orderBy: { scheduledAt: 'asc' }
    })
  );

  for (const campaign of campaigns) {
    try {
      await withRetry(() =>
        prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'RUNNING' as any } })
      );

      const recipients: any[] = Array.isArray((campaign as any).recipients) ? (campaign as any).recipients : [];
      let sentCount = 0;
      let bounceCount = 0;

      for (const r of recipients) {
        const email = typeof r === 'string' ? r : r?.email;
        if (!email) continue;
        try {
          await sendEmail({ to: email, subject: campaign.subject, html: campaign.content, from: undefined });
          await prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientId: 'unknown',
              recipientEmail: email,
              status: 'SENT' as any,
              sentAt: new Date()
            }
          });
          sentCount += 1;
        } catch (e: any) {
          await prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientId: 'unknown',
              recipientEmail: email,
              status: 'FAILED' as any,
              error: e?.message || 'send failed'
            }
          });
          bounceCount += 1;
        }
      }

      await withRetry(() =>
        prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED' as any,
            sentCount: { increment: sentCount },
            bounceCount: { increment: bounceCount },
            sentAt: new Date()
          }
        })
      );
    } catch (e) {
      // Mark as cancelled on fatal error to prevent tight loops
      await prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: 'CANCELLED' as any } });
    }
  }
}

let schedulerStarted = false;
export function startSchedulers() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  // Kick once on boot, then run every 60s
  runScheduledRules().catch(() => {});
  runScheduledEmailCampaigns().catch(() => {});
  setInterval(() => {
    runScheduledRules().catch(() => {});
    runScheduledEmailCampaigns().catch(() => {});
  }, 60 * 1000);
}

export default { startSchedulers };
