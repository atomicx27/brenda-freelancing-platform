import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, AppError } from '../types';
import { createError } from '../middleware/errorHandler';

// Helper for database retries
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || !error.message?.includes('connection') && !error.message?.includes('timeout')) {
        throw error;
      }
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Max retries exceeded');
};

// ==================== AUTOMATION RULES ====================

// Get automation rules
export const getAutomationRules = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, isActive } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await withRetry(() =>
      prisma.automationRule.findMany({
        where,
        orderBy: { priority: 'desc' },
        include: {
          _count: {
            select: { logs: true }
          }
        }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
};

// Create automation rule
export const createAutomationRule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, type, trigger, conditions, actions, priority = 0 } = req.body;
    const userId = req.user!.id;

    const rule = await withRetry(() =>
      prisma.automationRule.create({
        data: {
          name,
          description,
          type,
          trigger,
          conditions,
          actions,
          priority,
          userId
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Automation rule created successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
};

// Execute automation rule
export const executeAutomationRule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const userId = req.user!.id;

    const rule = await withRetry(() =>
      prisma.automationRule.findFirst({
        where: { id: ruleId, userId }
      })
    );

    if (!rule) {
      throw createError('Automation rule not found', 404);
    }

    // Execute the automation rule
    const startTime = Date.now();
    let status = 'SUCCESS';
    let message = 'Automation executed successfully';
    let error = null;

    try {
      await executeAutomationActions(rule);
      await withRetry(() =>
        prisma.automationRule.update({
          where: { id: ruleId },
          data: {
            lastRun: new Date(),
            runCount: { increment: 1 },
            successCount: { increment: 1 }
          }
        })
      );
    } catch (execError: any) {
      status = 'FAILED';
      message = 'Automation execution failed';
      error = execError.message;
      await withRetry(() =>
        prisma.automationRule.update({
          where: { id: ruleId },
          data: {
            lastRun: new Date(),
            runCount: { increment: 1 },
            errorCount: { increment: 1 }
          }
        })
      );
    }

    // Log the execution
    const duration = Date.now() - startTime;
    await withRetry(() =>
      prisma.automationLog.create({
        data: {
          ruleId,
          userId,
          status: status as any,
          message,
          error,
          duration
        }
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Automation rule executed',
      data: { status, message, duration }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SMART CONTRACTS ====================

// Get smart contracts
export const getSmartContracts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { clientId: userId },
        { freelancerId: userId }
      ]
    };
    if (status) where.status = status;

    const [contracts, total] = await withRetry(async () => {
      return Promise.all([
        prisma.smartContract.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true
              }
            },
            template: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.smartContract.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        contracts,
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

// Generate smart contract
export const generateSmartContract = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      jobId, 
      clientId, 
      freelancerId, 
      templateId,
      terms,
      expiresAt 
    } = req.body;
    const userId = req.user!.id;

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await withRetry(() =>
        prisma.contractTemplate.findUnique({
          where: { id: templateId }
        })
      );
    }

    // Generate contract content
    const contractContent = generateContractContent(template, terms, {
      title,
      description,
      clientId,
      freelancerId,
      jobId
    });

    const contract = await withRetry(() =>
      prisma.smartContract.create({
        data: {
          title,
          description,
          jobId,
          clientId,
          freelancerId,
          templateId,
          content: contractContent,
          terms,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    );

    // Update template usage count
    if (templateId) {
      await withRetry(() =>
        prisma.contractTemplate.update({
          where: { id: templateId },
          data: { usageCount: { increment: 1 } }
        })
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Smart contract generated successfully',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== AUTOMATED INVOICING ====================

// Get invoices
export const getInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { clientId: userId },
        { freelancerId: userId }
      ]
    };
    if (status) where.status = status;

    const [invoices, total] = await withRetry(async () => {
      return Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true
              }
            },
            contract: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        prisma.invoice.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        invoices,
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

// Generate invoice
export const generateInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      contractId, 
      clientId, 
      freelancerId, 
      jobId,
      title, 
      description, 
      items, 
      taxRate = 0,
      dueDate,
      isRecurring = false,
      recurringInterval
    } = req.body;
    const userId = req.user!.id;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await withRetry(() =>
      prisma.invoice.create({
        data: {
          invoiceNumber,
          contractId,
          clientId,
          freelancerId,
          jobId,
          title,
          description,
          items,
          subtotal,
          taxRate,
          taxAmount,
          total,
          dueDate: new Date(dueDate),
          isRecurring,
          recurringInterval
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          job: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Invoice generated successfully',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== EMAIL MARKETING AUTOMATION ====================

// Get email campaigns
export const getEmailCampaigns = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const userId = req.user!.id;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [campaigns, total] = await withRetry(async () => {
      return Promise.all([
        prisma.emailCampaign.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { emails: true }
            }
          }
        }),
        prisma.emailCampaign.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        campaigns,
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

// Create email campaign
export const createEmailCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      name, 
      description, 
      type, 
      subject, 
      content, 
      template,
      recipients, 
      filters, 
      schedule,
      scheduledAt 
    } = req.body;
    const userId = req.user!.id;

    const campaign = await withRetry(() =>
      prisma.emailCampaign.create({
        data: {
          name,
          description,
          type,
          subject,
          content,
          template,
          recipients,
          filters,
          schedule,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          userId
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Email campaign created successfully',
      data: { campaign }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LEAD SCORING ====================

// Get lead scores
export const getLeadScores = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leadType, minScore } = req.query;
    const userId = req.user!.id;

    const where: any = { userId, isActive: true };
    if (leadType) where.leadType = leadType;
    if (minScore) where.score = { gte: Number(minScore) };

    const leadScores = await withRetry(() =>
      prisma.leadScore.findMany({
        where,
        orderBy: { score: 'desc' }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { leadScores }
    });
  } catch (error) {
    next(error);
  }
};

// Calculate lead score
export const calculateLeadScore = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leadId, leadType, factors } = req.body;
    const userId = req.user!.id;

    // Calculate score based on factors
    const score = calculateScoreFromFactors(factors);

    const leadScore = await withRetry(() =>
      prisma.leadScore.upsert({
        where: {
          userId_leadId_leadType: {
            userId,
            leadId,
            leadType: leadType as any
          }
        },
        update: {
          score,
          factors,
          lastUpdated: new Date()
        },
        create: {
          userId,
          leadId,
          leadType: leadType as any,
          score,
          factors
        }
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Lead score calculated successfully',
      data: { leadScore }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== FOLLOW-UP AUTOMATION ====================

// Get follow-up rules
export const getFollowUpRules = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { trigger, isActive } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (trigger) where.trigger = trigger;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await withRetry(() =>
      prisma.followUpRule.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
};

// Create follow-up rule
export const createFollowUpRule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, trigger, conditions, actions, delay } = req.body;
    const userId = req.user!.id;

    const rule = await withRetry(() =>
      prisma.followUpRule.create({
        data: {
          name,
          description,
          trigger,
          conditions,
          actions,
          delay,
          userId
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Follow-up rule created successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DEADLINE REMINDERS ====================

// Get reminders
export const getReminders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, priority, isCompleted, upcoming = 'true' } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
    if (upcoming === 'true') {
      where.dueDate = { gte: new Date() };
    }

    const reminders = await withRetry(() =>
      prisma.reminder.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ]
      })
    );

    res.status(200).json({
      status: 'success',
      data: { reminders }
    });
  } catch (error) {
    next(error);
  }
};

// Create reminder
export const createReminder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      type, 
      relatedId, 
      relatedType, 
      dueDate, 
      isRecurring = false,
      recurringInterval,
      priority = 'MEDIUM' 
    } = req.body;
    const userId = req.user!.id;

    const reminder = await withRetry(() =>
      prisma.reminder.create({
        data: {
          title,
          description,
          type,
          relatedId,
          relatedType,
          dueDate: new Date(dueDate),
          isRecurring,
          recurringInterval,
          priority: priority as any,
          userId
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Reminder created successfully',
      data: { reminder }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== STATUS UPDATE AUTOMATION ====================

// Get status update rules
export const getStatusUpdateRules = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityType, isActive } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (entityType) where.entityType = entityType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rules = await withRetry(() =>
      prisma.statusUpdateRule.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
    );

    res.status(200).json({
      status: 'success',
      data: { rules }
    });
  } catch (error) {
    next(error);
  }
};

// Create status update rule
export const createStatusUpdateRule = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, entityType, conditions, newStatus } = req.body;
    const userId = req.user!.id;

    const rule = await withRetry(() =>
      prisma.statusUpdateRule.create({
        data: {
          name,
          description,
          entityType,
          conditions,
          newStatus,
          userId
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Status update rule created successfully',
      data: { rule }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HELPER FUNCTIONS ====================

// Execute automation actions
const executeAutomationActions = async (rule: any) => {
  const actions = rule.actions;
  
  for (const action of actions) {
    switch (action.type) {
      case 'SEND_EMAIL':
        await sendAutomatedEmail(action);
        break;
      case 'CREATE_INVOICE':
        await createAutomatedInvoice(action);
        break;
      case 'UPDATE_STATUS':
        await updateEntityStatus(action);
        break;
      case 'CREATE_REMINDER':
        await createAutomatedReminder(action);
        break;
      case 'GENERATE_CONTRACT':
        await generateAutomatedContract(action);
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }
};

// Generate contract content
const generateContractContent = (template: any, terms: any, data: any) => {
  if (!template) {
    return generateDefaultContract(terms, data);
  }

  let content = template.content;
  
  // Replace template variables
  const variables = template.variables || {};
  Object.keys(variables).forEach(key => {
    const value = data[key] || variables[key] || '';
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return content;
};

// Generate default contract
const generateDefaultContract = (terms: any, data: any) => {
  return `
# Service Agreement

**Project:** ${data.title || 'Freelance Project'}
**Client:** ${data.clientId}
**Freelancer:** ${data.freelancerId}

## Terms and Conditions

${terms?.description || 'Standard freelance service terms apply.'}

## Payment Terms
${terms?.payment || 'Payment to be made upon completion of work.'}

## Timeline
${terms?.timeline || 'Project timeline to be agreed upon by both parties.'}

## Intellectual Property
${terms?.ip || 'All work product remains the property of the client upon payment.'}

This agreement is effective as of the date of signing by both parties.
  `.trim();
};

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`
      }
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

// Calculate score from factors
const calculateScoreFromFactors = (factors: any): number => {
  let score = 0;
  
  // Example scoring logic
  if (factors.profileCompleteness) score += factors.profileCompleteness * 10;
  if (factors.verificationStatus) score += factors.verificationStatus ? 20 : 0;
  if (factors.responseTime) score += Math.max(0, 30 - factors.responseTime);
  if (factors.portfolioQuality) score += factors.portfolioQuality * 15;
  if (factors.reviewRating) score += factors.reviewRating * 2;
  if (factors.jobHistory) score += Math.min(factors.jobHistory * 5, 25);
  
  return Math.min(score, 100); // Cap at 100
};

// Placeholder functions for automation actions
import { sendEmail } from '../services/emailService';

const sendAutomatedEmail = async (action: any) => {
  // Expected action shape: { type: 'SEND_EMAIL', to, subject, html, from? }
  const { to, subject, html, from } = action || {};
  if (!to || !subject || !html) {
    console.warn('SEND_EMAIL action missing required fields. Expected to, subject, html.');
    return;
  }
  await sendEmail({ to, subject, html, from });
};

const createAutomatedInvoice = async (action: any) => {
  console.log('Creating automated invoice:', action);
  // Implement invoice creation logic
};

const updateEntityStatus = async (action: any) => {
  console.log('Updating entity status:', action);
  // Implement status update logic
};

const createAutomatedReminder = async (action: any) => {
  console.log('Creating automated reminder:', action);
  // Implement reminder creation logic
};

const generateAutomatedContract = async (action: any) => {
  console.log('Generating automated contract:', action);
  // Implement contract generation logic
};


