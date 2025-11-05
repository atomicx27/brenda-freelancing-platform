import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest, AppError } from '../types';
import { createError } from '../middleware/errorHandler';
import { emitEvent } from '../services/events';

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

    // Emit event for EVENT_BASED rules
    emitEvent('CONTRACT_GENERATED', {
      contractId: contract.id,
      clientId,
      freelancerId,
      jobId,
      title
    });

    res.status(201).json({
      status: 'success',
      message: 'Smart contract generated successfully',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// Update smart contract (for signing, etc.)
export const updateSmartContract = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contractId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    // Get existing contract
    const existingContract = await withRetry(() =>
      prisma.smartContract.findUnique({
        where: { id: contractId },
        include: {
          client: true,
          freelancer: true,
          job: true
        }
      })
    );

    if (!existingContract) {
      throw createError('Contract not found', 404);
    }

    // Check authorization - only client or freelancer can update
    if (existingContract.clientId !== userId && existingContract.freelancerId !== userId) {
      throw createError('You are not authorized to update this contract', 403);
    }

    // Determine who is signing
    const isClient = existingContract.clientId === userId;
    const isFreelancer = existingContract.freelancerId === userId;

    // Prepare update data
    const updateData: any = {};
    const now = new Date();
    
    if (status) {
      // Handle dual signature workflow
      if (status === 'SIGNED' || status === 'CLIENT_SIGNED') {
        if (isClient) {
          // Client is signing
          if (existingContract.clientSignedAt) {
            throw createError('You have already signed this contract', 400);
          }
          
          updateData.clientSignedAt = now;
          
          // If freelancer hasn't signed yet, set status to CLIENT_SIGNED
          if (!existingContract.freelancerSignedAt) {
            updateData.status = 'CLIENT_SIGNED';
          } else {
            // Both have signed now
            updateData.status = 'SIGNED';
            updateData.signedAt = now;
          }
        } else if (isFreelancer) {
          // Freelancer is signing
          if (existingContract.freelancerSignedAt) {
            throw createError('You have already signed this contract', 400);
          }
          
          // Freelancer can only sign if client has signed first
          if (!existingContract.clientSignedAt) {
            throw createError('Client must sign the contract first', 400);
          }
          
          updateData.freelancerSignedAt = now;
          
          // Both have signed now
          updateData.status = 'SIGNED';
          updateData.signedAt = now;
        }
      } else {
        // Other status updates
        updateData.status = status;
      }
    }

    // Update contract
    const contract = await withRetry(() =>
      prisma.smartContract.update({
        where: { id: contractId },
        data: updateData,
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

    // Only trigger invoice generation when BOTH parties have signed
    if (updateData.status === 'SIGNED' && updateData.signedAt) {
      try {
        const { autoGenerateInvoiceOnContractSigned } = require('../services/automationService');
        await autoGenerateInvoiceOnContractSigned(contractId);
        console.log(`✅ [Automation] Invoice auto-generated for fully signed contract ${contractId}`);
      } catch (autoError: any) {
        console.error(`⚠️ [Automation] Failed to auto-generate invoice:`, autoError.message);
        // Don't fail the contract signing if invoice generation fails
      }

      // Emit contract signed event only when both parties have signed
      emitEvent('CONTRACT_SIGNED', {
        contractId: contract.id,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
        jobId: contract.jobId
      });
    } else if (updateData.status === 'CLIENT_SIGNED') {
      // Emit client signed event
      emitEvent('CONTRACT_CLIENT_SIGNED', {
        contractId: contract.id,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
        jobId: contract.jobId
      });
    }

    res.status(200).json({
      status: 'success',
      message: isClient 
        ? (updateData.status === 'SIGNED' ? 'Contract fully signed!' : 'Contract signed and sent to freelancer')
        : 'Contract accepted and fully signed!',
      data: { contract }
    });
  } catch (error) {
    next(error);
  }
};

// Get contract templates
export const getContractTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, isActive, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isPublic: true };
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [templates, total] = await withRetry(async () => {
      return Promise.all([
        prisma.contractTemplate.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { usageCount: 'desc' }
        }),
        prisma.contractTemplate.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        templates,
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

// Create contract template
export const createContractTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, category, content, variables, isPublic = false, terms = {} } = req.body;

    const template = await withRetry(() =>
      prisma.contractTemplate.create({
        data: {
          name,
          description,
          category,
          content,
          variables: variables || [],
          terms: terms,
          isPublic
        }
      })
    );

    res.status(201).json({
      status: 'success',
      message: 'Contract template created successfully',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

// Update contract template
export const updateContractTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { name, description, category, content, variables, isPublic, isActive, terms } = req.body;

    // Check if template exists
    const existing = await withRetry(() =>
      prisma.contractTemplate.findUnique({
        where: { id: templateId }
      })
    );

    if (!existing) {
      throw createError('Contract template not found', 404);
    }

    const template = await withRetry(() =>
      prisma.contractTemplate.update({
        where: { id: templateId },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(category && { category }),
          ...(content && { content }),
          ...(variables && { variables }),
          ...(terms && { terms }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isActive !== undefined && { isActive })
        }
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Contract template updated successfully',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

// Delete contract template
export const deleteContractTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { templateId } = req.params;

    // Check if template exists
    const existing = await withRetry(() =>
      prisma.contractTemplate.findUnique({
        where: { id: templateId }
      })
    );

    if (!existing) {
      throw createError('Contract template not found', 404);
    }

    await withRetry(() =>
      prisma.contractTemplate.delete({
        where: { id: templateId }
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Contract template deleted successfully'
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

    // Emit event for EVENT_BASED rules
    emitEvent('INVOICE_CREATED', {
      invoiceId: invoice.id,
      clientId,
      freelancerId,
      jobId,
      total
    });

    res.status(201).json({
      status: 'success',
      message: 'Invoice generated successfully',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

// Process recurring invoices (called by scheduler)
export const processRecurringInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Find all recurring invoices that need to be processed
    const baseInvoices = await withRetry(() =>
      prisma.invoice.findMany({
        where: {
          isRecurring: true,
          status: 'PAID', // Only process paid invoices
          recurringInterval: { not: null }
        },
        include: {
          client: true,
          freelancer: true,
          job: true
        }
      })
    );

    const results = [];
    for (const baseInvoice of baseInvoices) {
      try {
        // Calculate next due date based on interval
        const nextDueDate = calculateNextDueDate(baseInvoice.dueDate, baseInvoice.recurringInterval!);
        
        // Check if it's time to create a new invoice
        if (new Date() >= nextDueDate) {
          // Generate invoice number first
          const invoiceNumber = await generateInvoiceNumber();
          
          // Create new invoice from recurring template
          const newInvoice = await withRetry(() =>
            prisma.invoice.create({
              data: {
                invoiceNumber,
                contractId: baseInvoice.contractId,
                clientId: baseInvoice.clientId,
                freelancerId: baseInvoice.freelancerId,
                jobId: baseInvoice.jobId,
                title: baseInvoice.title,
                description: baseInvoice.description,
                items: baseInvoice.items as any,
                subtotal: baseInvoice.subtotal,
                taxRate: baseInvoice.taxRate,
                taxAmount: baseInvoice.taxAmount,
                total: baseInvoice.total,
                dueDate: nextDueDate,
                isRecurring: false, // New invoices are not recurring templates
                recurringInterval: null
              }
            })
          );

          // Emit event
          emitEvent('INVOICE_CREATED', {
            invoiceId: newInvoice.id,
            clientId: newInvoice.clientId,
            freelancerId: newInvoice.freelancerId,
            jobId: newInvoice.jobId,
            total: newInvoice.total,
            isRecurring: true
          });

          results.push({
            baseInvoiceId: baseInvoice.id,
            newInvoiceId: newInvoice.id,
            status: 'created'
          });
        }
      } catch (error: any) {
        results.push({
          baseInvoiceId: baseInvoice.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Processed ${results.length} recurring invoices`,
      data: { results }
    });
  } catch (error) {
    next(error);
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const { status, paidAt } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const invoice = await withRetry(() =>
      prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          OR: [
            { clientId: userId },
            { freelancerId: userId }
          ]
        }
      })
    );

    if (!invoice) {
      throw createError('Invoice not found or unauthorized', 404);
    }

    const updated = await withRetry(() =>
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: status as any,
          paidAt: paidAt ? new Date(paidAt) : null
        }
      })
    );

    // Emit event
    if (status === 'PAID') {
      emitEvent('INVOICE_PAID', {
        invoiceId: updated.id,
        clientId: updated.clientId,
        freelancerId: updated.freelancerId,
        total: updated.total
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Invoice status updated successfully',
      data: { invoice: updated }
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

// Execute email campaign
export const executeEmailCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const userId = req.user!.id;

    // Get campaign
    const campaign = await withRetry(() =>
      prisma.emailCampaign.findFirst({
        where: { id: campaignId, userId }
      })
    );

    if (!campaign) {
      throw createError('Email campaign not found', 404);
    }

    if (campaign.status === 'COMPLETED') {
      throw createError('Campaign has already been sent', 400);
    }

    // Get recipients based on filters
    const recipients = await getEmailRecipients(campaign.recipients, campaign.filters);

    // Send emails
    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const recipient of recipients) {
      try {
        // Send email (using Resend or other email service)
        await sendCampaignEmail(recipient, campaign);
        
        // Log email
        await withRetry(() =>
          prisma.emailLog.create({
            data: {
              campaignId: campaign.id,
              recipientId: recipient.id,
              recipientEmail: recipient.email,
              status: 'SENT',
              sentAt: new Date()
            }
          })
        );

        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          recipient: recipient.email,
          error: error.message
        });
      }
    }

    // Update campaign status
    await withRetry(() =>
      prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          sentAt: new Date(),
          sentCount: results.sent
        }
      })
    );

    // Emit event
    emitEvent('CAMPAIGN_SENT', {
      campaignId,
      userId,
      totalSent: results.sent,
      totalFailed: results.failed
    });

    res.status(200).json({
      status: 'success',
      message: 'Email campaign executed successfully',
      data: { results }
    });
  } catch (error) {
    next(error);
  }
};

// Get campaign analytics
export const getEmailCampaignAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const campaign = await withRetry(() =>
      prisma.emailCampaign.findFirst({
        where: { id: campaignId, userId }
      })
    );

    if (!campaign) {
      throw createError('Email campaign not found', 404);
    }

    // Get email statistics
    const [total, delivered, opened, clicked, bounced] = await withRetry(async () => {
      return Promise.all([
        prisma.emailLog.count({ where: { campaignId } }),
        prisma.emailLog.count({ where: { campaignId, status: 'DELIVERED' } }),
        prisma.emailLog.count({ where: { campaignId, openedAt: { not: null } } }),
        prisma.emailLog.count({ where: { campaignId, clickedAt: { not: null } } }),
        prisma.emailLog.count({ where: { campaignId, bouncedAt: { not: null } } })
      ]);
    });

    const analytics = {
      total,
      delivered,
      opened,
      clicked,
      bounced,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
      openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : 0,
      clickRate: opened > 0 ? ((clicked / opened) * 100).toFixed(2) : 0,
      bounceRate: total > 0 ? ((bounced / total) * 100).toFixed(2) : 0
    };

    res.status(200).json({
      status: 'success',
      data: { analytics }
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
export const executeAutomationActions = async (rule: any, context?: any) => {
  const actions = rule.actions;
  
  for (const action of actions) {
    // Replace {{event.xxx}} templates with context data
    const processedAction = resolveActionTemplates(action, context);
    
    switch (processedAction.type) {
      case 'SEND_EMAIL':
        await sendAutomatedEmail(processedAction);
        break;
      case 'CREATE_INVOICE':
        await createAutomatedInvoice(processedAction);
        break;
      case 'UPDATE_STATUS':
        await updateEntityStatus(processedAction);
        break;
      case 'CREATE_REMINDER':
        await createAutomatedReminder(processedAction);
        break;
      case 'GENERATE_CONTRACT':
        await generateAutomatedContract(processedAction);
        break;
      default:
        console.log(`Unknown action type: ${processedAction.type}`);
    }
  }
};

// Replace {{event.xxx}} placeholders in action strings
const resolveActionTemplates = (value: any, context?: any): any => {
  if (!context) return value;
  
  if (typeof value === 'string') {
    return value.replace(/{{\s*event\.([\w.]+)\s*}}/g, (_m, path) => {
      const parts = String(path).split('.');
      let cur: any = context?.event ?? {};
      for (const p of parts) cur = cur?.[p];
      return cur == null ? '' : String(cur);
    });
  }
  
  if (Array.isArray(value)) {
    return value.map(v => resolveActionTemplates(v, context));
  }
  
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      out[k] = resolveActionTemplates(value[k], context);
    }
    return out;
  }
  
  return value;
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
  // Expected action shape: {
  //  type: 'CREATE_INVOICE', clientId, freelancerId, jobId?, contractId?, title,
  //  description?, items: [{ description, quantity, rate }], taxRate?, dueDate,
  //  isRecurring?, recurringInterval?
  // }
  const {
    contractId,
    clientId,
    freelancerId,
    jobId,
    title,
    description,
    items = [],
    taxRate = 0,
    dueDate,
    isRecurring = false,
    recurringInterval
  } = action || {};

  if (!clientId || !freelancerId || !title || !Array.isArray(items) || !dueDate) {
    console.warn('CREATE_INVOICE action missing required fields.');
    return;
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const total = subtotal + taxAmount;

  const invoiceNumber = await generateInvoiceNumber();

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      contractId: contractId || null,
      clientId,
      freelancerId,
      jobId: jobId || null,
      title,
      description,
      items,
      subtotal,
      taxRate: Number(taxRate) || 0,
      taxAmount,
      total,
      dueDate: new Date(dueDate),
      isRecurring: !!isRecurring,
      recurringInterval: recurringInterval || null
    }
  });
};

const updateEntityStatus = async (action: any) => {
  // Expected action shape: { type: 'UPDATE_STATUS', entityType, entityId, newStatus }
  const { entityType, entityId, newStatus } = action || {};
  if (!entityType || !entityId || !newStatus) {
    console.warn('UPDATE_STATUS action missing required fields.');
    return;
  }

  switch (entityType) {
    case 'JOB':
      await prisma.job.update({ where: { id: entityId }, data: { status: newStatus } as any });
      break;
    case 'CONTRACT':
      await prisma.smartContract.update({ where: { id: entityId }, data: { status: newStatus as any } });
      break;
    case 'INVOICE':
      await prisma.invoice.update({ where: { id: entityId }, data: { status: newStatus as any } });
      break;
    case 'PROPOSAL':
      await prisma.proposal.update({ where: { id: entityId }, data: { status: newStatus } as any });
      break;
    case 'USER':
      await prisma.user.update({ where: { id: entityId }, data: { status: newStatus as any } });
      break;
    default:
      console.warn(`UPDATE_STATUS unsupported entityType: ${entityType}`);
  }
};

const createAutomatedReminder = async (action: any) => {
  // Expected action shape: { type: 'CREATE_REMINDER', userId, title, description?, dueDate, priority?, relatedId?, relatedType?, type }
  const { userId, title, description, dueDate, priority = 'MEDIUM', relatedId, relatedType, type = 'CUSTOM' } = action || {};
  if (!userId || !title || !dueDate) {
    console.warn('CREATE_REMINDER action missing required fields.');
    return;
  }
  await prisma.reminder.create({
    data: {
      userId,
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      type
    }
  });
};

const generateAutomatedContract = async (action: any) => {
  // Expected action shape: { type: 'GENERATE_CONTRACT', title, description?, jobId?, clientId, freelancerId, templateId?, terms?, expiresAt? }
  const { title, description, jobId, clientId, freelancerId, templateId, terms = {}, expiresAt } = action || {};
  if (!title || !clientId || !freelancerId) {
    console.warn('GENERATE_CONTRACT action missing required fields.');
    return;
  }

  let template = null as any;
  if (templateId) {
    template = await prisma.contractTemplate.findUnique({ where: { id: templateId } });
  }
  const content = generateContractContent(template, terms, { title, description, clientId, freelancerId, jobId });
  await prisma.smartContract.create({
    data: {
      title,
      description,
      jobId: jobId || null,
      clientId,
      freelancerId,
      templateId: templateId || null,
      content,
      terms,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }
  });
  if (templateId) {
    await prisma.contractTemplate.update({ where: { id: templateId }, data: { usageCount: { increment: 1 } } });
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate contract content with variable substitution
 */
function generateContractContent(template: any, terms: any, data: any): string {
  let content = '';

  // Use template content if available, otherwise create default content
  if (template && template.content) {
    content = template.content;
  } else {
    // Default contract template
    content = `
# {{title}}

## Contract Agreement

This Contract Agreement ("Agreement") is entered into on {{currentDate}} between:

**Client:** {{clientName}}
**Freelancer:** {{freelancerName}}

### Project Description
{{description}}

### Terms and Conditions

#### 1. Scope of Work
{{terms.scope}}

#### 2. Payment Terms
{{terms.payment}}

#### 3. Timeline
{{terms.timeline}}

#### 4. Deliverables
{{terms.deliverables}}

#### 5. Intellectual Property
{{terms.ip}}

#### 6. Termination
{{terms.termination}}

#### 7. Confidentiality
{{terms.confidentiality}}

### Additional Terms
{{terms.additional}}

---

**Client Signature:** ___________________ Date: _______________

**Freelancer Signature:** ___________________ Date: _______________
`;
  }

  // Variable substitution
  const variables: Record<string, string> = {
    '{{title}}': data.title || 'Untitled Contract',
    '{{description}}': data.description || 'No description provided',
    '{{currentDate}}': new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    '{{clientName}}': data.clientName || 'Client Name',
    '{{freelancerName}}': data.freelancerName || 'Freelancer Name',
    '{{terms.scope}}': terms.scope || terms.description || 'To be defined',
    '{{terms.payment}}': terms.payment || 'To be agreed upon',
    '{{terms.timeline}}': terms.timeline || 'To be determined',
    '{{terms.deliverables}}': terms.deliverables || 'To be specified',
    '{{terms.ip}}': terms.ip || 'All intellectual property rights belong to the client upon full payment.',
    '{{terms.termination}}': terms.termination || 'Either party may terminate this agreement with 7 days written notice.',
    '{{terms.confidentiality}}': terms.confidentiality || 'Both parties agree to keep all project information confidential.',
    '{{terms.additional}}': terms.additional || 'N/A'
  };

  // Replace all variables
  let processedContent = content;
  for (const [variable, value] of Object.entries(variables)) {
    processedContent = processedContent.replace(new RegExp(variable, 'g'), value);
  }

  return processedContent;
}

/**
 * Calculate invoice tax and totals
 */
function calculateInvoiceTotals(items: any[], taxRate: number = 0): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 1) * (item.rate || 0);
    return sum + itemTotal;
  }, 0);

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

/**
 * Calculate lead score based on multiple factors
 */
function calculateLeadScoreValue(user: any, factors: any): number {
  let score = 0;
  const weights = factors.weights || {};

  // Profile completeness (0-25 points)
  if (weights.profileCompleteness !== undefined) {
    const completeness = calculateProfileCompleteness(user);
    score += completeness * (weights.profileCompleteness / 100) * 25;
  }

  // Verification status (0-20 points)
  if (weights.verification !== undefined) {
    const verificationScore = user.profile?.isVerified ? 20 : 0;
    score += verificationScore * (weights.verification / 100);
  }

  // Response time (0-15 points)
  if (weights.responseTime !== undefined) {
    const responseScore = calculateResponseTimeScore(user);
    score += responseScore * (weights.responseTime / 100) * 15;
  }

  // Activity level (0-15 points)
  if (weights.activityLevel !== undefined) {
    const activityScore = calculateActivityScore(user);
    score += activityScore * (weights.activityLevel / 100) * 15;
  }

  // Success rate (0-15 points)
  if (weights.successRate !== undefined) {
    const successScore = calculateSuccessRate(user);
    score += successScore * (weights.successRate / 100) * 15;
  }

  // Reviews (0-10 points)
  if (weights.reviews !== undefined) {
    const reviewScore = calculateReviewScore(user);
    score += reviewScore * (weights.reviews / 100) * 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateProfileCompleteness(user: any): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.profile?.title,
    user.profile?.bio,
    user.profile?.skills?.length > 0,
    user.profile?.hourlyRate,
    user.profile?.avatar
  ];
  const completed = fields.filter(f => f).length;
  return completed / fields.length;
}

function calculateResponseTimeScore(user: any): number {
  // Placeholder - would need actual response time data
  return 0.8; // 80% score
}

function calculateActivityScore(user: any): number {
  // Placeholder - would calculate based on recent activity
  const daysSinceUpdate = Math.floor((Date.now() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate < 7) return 1.0;
  if (daysSinceUpdate < 30) return 0.7;
  if (daysSinceUpdate < 90) return 0.4;
  return 0.1;
}

function calculateSuccessRate(user: any): number {
  // Placeholder - would calculate from completed jobs
  return 0.85; // 85% success rate
}

function calculateReviewScore(user: any): number {
  // Placeholder - would calculate from review ratings
  return 0.9; // 90% based on reviews
}

/**
 * Calculate next due date for recurring invoices
 */
function calculateNextDueDate(currentDueDate: Date, interval: string): Date {
  const nextDate = new Date(currentDueDate);

  switch (interval) {
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

/**
 * Get email recipients based on filters
 */
async function getEmailRecipients(recipientType: any, filters: any): Promise<any[]> {
  const where: any = {};

  // Apply filters
  if (filters) {
    if (filters.userType) where.userType = filters.userType;
    if (filters.isVerified !== undefined) {
      where.profile = { isVerified: filters.isVerified };
    }
    if (filters.minScore) {
      where.leadScore = { score: { gte: filters.minScore } };
    }
  }

  // Get users based on recipient type
  switch (recipientType) {
    case 'ALL_USERS':
      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    
    case 'FREELANCERS':
      where.userType = 'FREELANCER';
      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    
    case 'CLIENTS':
      where.userType = 'CLIENT';
      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    
    case 'VERIFIED_USERS':
      where.profile = { isVerified: true };
      return await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    
    default:
      return [];
  }
}

/**
 * Send campaign email to recipient
 */
async function sendCampaignEmail(recipient: any, campaign: any): Promise<void> {
  // Placeholder for actual email sending implementation
  // Would integrate with Resend, SendGrid, or other email service
  
  // For now, just log
  console.log(`Sending campaign "${campaign.name}" to ${recipient.email}`);
  
  // In production, would call email service:
  // await resend.emails.send({
  //   from: 'no-reply@brenda.com',
  //   to: recipient.email,
  //   subject: campaign.subject,
  //   html: processEmailTemplate(campaign.content, recipient)
  // });
}

/**
 * Process email template with variables
 */
function processEmailTemplate(template: string, recipient: any): string {
  let processed = template;
  
  // Replace common variables
  processed = processed.replace(/{{firstName}}/g, recipient.firstName || '');
  processed = processed.replace(/{{lastName}}/g, recipient.lastName || '');
  processed = processed.replace(/{{email}}/g, recipient.email || '');
  processed = processed.replace(/{{fullName}}/g, `${recipient.firstName} ${recipient.lastName}`.trim());
  
  return processed;
}


