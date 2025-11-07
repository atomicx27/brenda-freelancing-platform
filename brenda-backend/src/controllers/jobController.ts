import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { createHash } from 'crypto';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { generateJobMatchAnalysis } from '../services/aiService';

// Validation rules for job creation
export const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .isIn(['FIXED', 'HOURLY', 'RANGE'])
    .withMessage('Budget type must be FIXED, HOURLY, or RANGE'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('skills')
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each skill must be between 2 and 50 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
];

export const updateJobValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('budgetType')
    .optional()
    .isIn(['FIXED', 'HOURLY', 'RANGE'])
    .withMessage('Budget type must be FIXED, HOURLY, or RANGE'),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must be less than 100 characters'),
  body('skills')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one skill is required'),
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each skill must be between 2 and 50 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('subcategory')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be less than 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('isRemote')
    .optional()
    .isBoolean()
    .withMessage('isRemote must be a boolean'),
  body('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be OPEN, IN_PROGRESS, COMPLETED, or CANCELLED'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
];

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

const normalizeProfileEntryArray = (value: unknown): { title: string; description: string }[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry) {
        return null;
      }

      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (!trimmed) {
          return null;
        }
        return { title: trimmed, description: '' };
      }

      if (typeof entry === 'object') {
        const title = typeof (entry as any).title === 'string' ? (entry as any).title.trim() : '';
        const description = typeof (entry as any).description === 'string' ? (entry as any).description.trim() : '';

        if (!title && !description) {
          return null;
        }

        return {
          title: title || description,
          description
        };
      }

      return null;
    })
    .filter((entry): entry is { title: string; description: string } => Boolean(entry))
    .slice(0, 12);
};

const uniqueStringArray = (values: unknown[], limit = 64): string[] => {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
};

const buildFreelancerMatchContext = async (req: AuthenticatedRequest) => {
  if (!req.user || req.user.userType !== 'FREELANCER') {
    return null;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.user.id },
    select: {
      title: true,
      availability: true,
      skills: true,
      languages: true,
      resumeSkills: true,
      resumeExperience: true,
      resumeProjects: true,
      resumeAchievements: true,
      resumeText: true
    }
  });

  if (!profile) {
    return null;
  }

  const experienceEntries = normalizeProfileEntryArray(profile.resumeExperience as any);
  const projectEntries = normalizeProfileEntryArray(profile.resumeProjects as any);
  const achievementEntries = normalizeProfileEntryArray(profile.resumeAchievements as any);

  const combinedSkills = uniqueStringArray([
    ...(profile.skills ?? []),
    ...(Array.isArray(profile.resumeSkills) ? profile.resumeSkills : [])
  ]);

  const languages = uniqueStringArray(profile.languages ?? [], 16);

  const hasContext =
    combinedSkills.length > 0 ||
    experienceEntries.length > 0 ||
    projectEntries.length > 0 ||
    achievementEntries.length > 0 ||
    Boolean(profile.resumeText && profile.resumeText.trim().length > 0);

  if (!hasContext) {
    return null;
  }

  const profileInput = {
    name: [req.user.firstName, req.user.lastName].filter(Boolean).join(' ') || undefined,
    title: profile.title || undefined,
    bio: req.user.bio || undefined,
    availability: profile.availability || undefined,
    skills: combinedSkills,
    languages,
    experienceHighlights: experienceEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    projectHighlights: projectEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    achievementHighlights: achievementEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    resumeText: profile.resumeText || undefined,
  };

  const skillSetLower = new Set(combinedSkills.map((skill) => skill.toLowerCase()));

  const profileSignature = createHash('sha1')
    .update(JSON.stringify(profileInput))
    .digest('hex');

  return {
    profileInput,
    profileSignature,
    skillSetLower,
  };
};

const enrichJobsWithMatchAnalysis = async (jobs: any[], req: AuthenticatedRequest): Promise<any[]> => {
  if (!req.user || req.user.userType !== 'FREELANCER' || jobs.length === 0) {
    return jobs;
  }

  const context = await buildFreelancerMatchContext(req);
  if (!context) {
    return jobs;
  }

  const { profileInput, profileSignature, skillSetLower } = context;

  const jobInputs = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    description: typeof job.description === 'string' ? job.description : '',
    skills: Array.isArray(job.skills) ? (job.skills as string[]) : [],
    category: job.category ?? null,
    subcategory: job.subcategory ?? null,
    budget: job.budget ?? null,
    budgetType: job.budgetType ?? null,
    duration: job.duration ?? null,
    location: job.location ?? null,
    isRemote: job.isRemote ?? null,
    deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : null,
  }));

  const jobIdToInput = new Map(jobInputs.map((input) => [input.id, input]));
  const jobIds = jobInputs.map((input) => input.id);

  const cachedInsights = await prisma.jobMatchInsight.findMany({
    where: {
      userId: req.user.id,
      jobId: { in: jobIds }
    }
  });

  const cachedMap = new Map(cachedInsights.map((entry) => [entry.jobId, entry]));
  const jobsNeedingAnalysis: any[] = [];
  const finalMatches: Record<string, { score: number; reasoning: string; source: 'ai' | 'fallback'; skills: string[]; generatedAt: Date; cached: boolean }> = {};

  for (const job of jobs) {
    const cached = cachedMap.get(job.id);
    const jobUpdatedAt: Date | null = job.updatedAt ? new Date(job.updatedAt) : null;

    let needsRefresh = !cached;

    if (!needsRefresh && cached?.profileVersion !== profileSignature) {
      needsRefresh = true;
    }

    if (!needsRefresh && jobUpdatedAt && cached?.jobUpdatedAt && jobUpdatedAt > cached.jobUpdatedAt) {
      needsRefresh = true;
    }

    if (needsRefresh) {
      jobsNeedingAnalysis.push(job);
      continue;
    }

    const sharedSkills = (Array.isArray(job.skills) ? (job.skills as string[]) : [])
      .filter((skill: string) => skillSetLower.has(skill.toLowerCase()))
      .slice(0, 6);

    finalMatches[job.id] = {
      score: cached!.score,
      reasoning: cached!.reasoning,
      source: (cached!.source === 'ai' ? 'ai' : 'fallback'),
      skills: sharedSkills,
      generatedAt: cached!.generatedAt,
      cached: true
    };
  }

  if (jobsNeedingAnalysis.length > 0) {
    const inputsForAnalysis = jobsNeedingAnalysis
      .map((job) => jobIdToInput.get(job.id))
      .filter((input): input is NonNullable<typeof input> => Boolean(input));

    const analysisMap = await generateJobMatchAnalysis(profileInput, inputsForAnalysis);

    const now = new Date();

    await Promise.all(jobsNeedingAnalysis.map(async (job) => {
      const match = analysisMap[job.id];

      const jobSkills = Array.isArray(job.skills) ? (job.skills as string[]) : [];
      const sharedSkills = jobSkills
        .filter((skill: string) => skillSetLower.has(skill.toLowerCase()))
        .slice(0, 6);

      const insight = match || {
        score: 0,
        reasoning: 'Unable to analyse this job automatically. Review the description manually.',
        source: 'fallback' as const,
      };

      finalMatches[job.id] = {
        score: insight.score,
        reasoning: insight.reasoning,
        source: insight.source,
        skills: sharedSkills,
        generatedAt: now,
        cached: false
      };

      await prisma.jobMatchInsight.upsert({
        where: {
          userId_jobId: {
            userId: req.user!.id,
            jobId: job.id
          }
        },
        update: {
          score: insight.score,
          reasoning: insight.reasoning,
          skills: sharedSkills,
          source: insight.source,
          profileVersion: profileSignature,
          jobUpdatedAt: job.updatedAt ?? new Date(),
          generatedAt: now,
        },
        create: {
          userId: req.user!.id,
          jobId: job.id,
          score: insight.score,
          reasoning: insight.reasoning,
          skills: sharedSkills,
          source: insight.source,
          profileVersion: profileSignature,
          jobUpdatedAt: job.updatedAt ?? new Date(),
          generatedAt: now,
        }
      });
    }));
  }

  return jobs.map((job) => {
    const match = finalMatches[job.id];
    if (!match) {
      return job;
    }

    return {
      ...job,
      matchAnalysis: {
        score: match.score,
        reasoning: match.reasoning,
        skills: match.skills,
        source: match.source,
        generatedAt: match.generatedAt,
        cached: match.cached
      }
    };
  });
};

// Get all jobs (public)
export const getAllJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      category, 
      skills, 
      location, 
      isRemote, 
      budgetMin, 
      budgetMax, 
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status: 'OPEN' };

    // Apply filters
    if (category) {
      where.category = category;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      where.skills = {
        hasSome: skillsArray
      };
    }

    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }

    if (isRemote !== undefined) {
      where.isRemote = isRemote === 'true';
    }

    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) where.budget.gte = Number(budgetMin);
      if (budgetMax) where.budget.lte = Number(budgetMax);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const [jobs, total] = await withRetry(async () => {
      return await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
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
            },
            _count: {
              select: {
                proposals: true
              }
            }
          }
        }),
        prisma.job.count({ where })
      ]);
    });

    const jobsWithMatch = await enrichJobsWithMatchAnalysis(jobs, req);

    const response: ApiResponse = {
      success: true,
      message: 'Jobs retrieved successfully',
      data: {
        jobs: jobsWithMatch,
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

// Get today's jobs
export const getTodaysJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
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
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    const jobsWithMatch = await enrichJobsWithMatchAnalysis(jobs, req);

    const response: ApiResponse = {
      success: true,
      message: 'Today\'s jobs retrieved successfully',
      data: jobsWithMatch
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get a specific job
export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            company: {
              select: {
                companyName: true,
                logo: true,
                description: true
              }
            }
          }
        },
        proposals: {
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
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    if (!job) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found'
      };
      res.status(404).json(response);
      return;
    }

    const [jobWithMatch] = await enrichJobsWithMatchAnalysis([job], req);

    const response: ApiResponse = {
      success: true,
      message: 'Job retrieved successfully',
      data: jobWithMatch
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get user's jobs (for clients)
export const getUserJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { ownerId: userId };

    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              proposals: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'User jobs retrieved successfully',
      data: {
        jobs,
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

// Create a new job
export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Debug: Log the received data
    console.log('Received job data:', req.body);
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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
      budget,
      budgetType,
      duration,
      skills,
      category,
      subcategory,
      location,
      isRemote = false,
      deadline
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        budgetType,
        duration,
        skills,
        category,
        subcategory,
        location,
        isRemote,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: userId
      },
      include: {
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
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job created successfully',
      data: job
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Update a job
export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Convert deadline to Date if provided
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingJob) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found or you do not have permission to update it'
      };
      res.status(404).json(response);
      return;
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
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
        },
        _count: {
          select: {
            proposals: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job updated successfully',
      data: job
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Delete a job
export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { id, ownerId: userId }
    });

    if (!existingJob) {
      const response: ApiResponse = {
        success: false,
        message: 'Job not found or you do not have permission to delete it'
      };
      res.status(404).json(response);
      return;
    }

    await prisma.job.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get job categories
export const getJobCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await withRetry(async () => {
      return await prisma.job.findMany({
        select: {
          category: true,
          subcategory: true
        },
        distinct: ['category'],
        where: {
          status: 'OPEN'
        }
      });
    });

    const response: ApiResponse = {
      success: true,
      message: 'Job categories retrieved successfully',
      data: categories.map(c => ({
        category: c.category,
        subcategory: c.subcategory
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get popular skills
export const getPopularSkills = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        skills: true
      },
      where: {
        status: 'OPEN'
      }
    });

    // Count skill occurrences
    const skillCounts: Record<string, number> = {};
    jobs.forEach(job => {
      job.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    // Sort by count and return top skills
    const popularSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    const response: ApiResponse = {
      success: true,
      message: 'Popular skills retrieved successfully',
      data: popularSkills
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
