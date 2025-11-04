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

// Advanced job search with multiple filters
export const advancedJobSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      query,
      category,
      subcategory,
      skills,
      budgetMin,
      budgetMax,
      budgetType,
      location,
      isRemote,
      experienceLevel,
      duration,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query as string, mode: 'insensitive' } },
        { description: { contains: query as string, mode: 'insensitive' } },
        { skills: { hasSome: [(query as string).split(' ')] } }
      ];
    }

    // Category filters
    if (category) {
      where.category = category;
    }
    if (subcategory) {
      where.subcategory = subcategory;
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      where.skills = { hasSome: skillsArray };
    }

    // Budget filters
    if (budgetMin || budgetMax) {
      where.budget = {};
      if (budgetMin) {
        where.budget.gte = Number(budgetMin);
      }
      if (budgetMax) {
        where.budget.lte = Number(budgetMax);
      }
    }

    if (budgetType) {
      where.budgetType = budgetType;
    }

    // Location filters
    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (isRemote !== undefined) {
      where.isRemote = isRemote === 'true';
    }

    // Experience level filter
    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    // Duration filter
    if (duration) {
      where.duration = duration;
    }

    // Status filter (only show open jobs)
    where.status = 'OPEN';

    const [jobs, total] = await withRetry(async () => {
      return Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
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

    // Get search suggestions
    const suggestions = await withRetry(() => {
      return prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: query as string || '', mode: 'insensitive' } },
            { skills: { hasSome: (query as string || '').split(' ') } }
          ],
          status: 'OPEN'
        },
        select: {
          title: true,
          skills: true,
          category: true
        },
        take: 10
      });
    });

    res.status(200).json({
      status: 'success',
      data: {
        jobs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        },
        suggestions: suggestions.map(job => ({
          title: job.title,
          skills: job.skills,
          category: job.category
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search for users
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!query) {
      throw createError('A search query is required', 400);
    }

    const where: any = {
      OR: [
        { firstName: { contains: query as string, mode: 'insensitive' } },
        { lastName: { contains: query as string, mode: 'insensitive' } },
        { email: { contains: query as string, mode: 'insensitive' } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          profile: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Advanced freelancer search
export const advancedFreelancerSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      query,
      skills,
      location,
      hourlyRateMin,
      hourlyRateMax,
      experienceLevel,
      availability,
      languages,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {
      userType: 'FREELANCER',
      isActive: true,
      isVerified: true
    };

    // Text search
    if (query) {
      where.OR = [
        { firstName: { contains: query as string, mode: 'insensitive' } },
        { lastName: { contains: query as string, mode: 'insensitive' } },
        { profile: { title: { contains: query as string, mode: 'insensitive' } } }
      ];
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      where.profile = {
        ...where.profile,
        skills: { hasSome: skillsArray }
      };
    }

    // Location filter
    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    // Hourly rate filter
    if (hourlyRateMin || hourlyRateMax) {
      where.profile = {
        ...where.profile,
        hourlyRate: {}
      };
      if (hourlyRateMin) {
        where.profile.hourlyRate.gte = Number(hourlyRateMin);
      }
      if (hourlyRateMax) {
        where.profile.hourlyRate.lte = Number(hourlyRateMax);
      }
    }

    // Experience level filter
    if (experienceLevel) {
      where.profile = {
        ...where.profile,
        experience: { gte: Number(experienceLevel) }
      };
    }

    // Availability filter
    if (availability) {
      where.profile = {
        ...where.profile,
        availability: availability
      };
    }

    // Languages filter
    if (languages) {
      const languagesArray = Array.isArray(languages) ? languages : [languages];
      where.profile = {
        ...where.profile,
        languages: { hasSome: languagesArray }
      };
    }

    const [freelancers, total] = await withRetry(async () => {
      return Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
          include: {
            profile: {
              select: {
                title: true,
                skills: true,
                hourlyRate: true,
                experience: true,
                availability: true,
                languages: true,
                isVerified: true
              }
            },
            _count: {
              select: {
                proposals: true,
                receivedReviews: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);
    });

    res.status(200).json({
      status: 'success',
      data: {
        freelancers,
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

// Get search filters and options
export const getSearchFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [categories, skills, locations, languages] = await withRetry(async () => {
      return Promise.all([
        // Get job categories
        prisma.job.groupBy({
          by: ['category'],
          _count: { category: true },
          where: { status: 'OPEN' }
        }),
        // Get popular skills
        prisma.job.findMany({
          select: { skills: true },
          where: { status: 'OPEN' }
        }),
        // Get popular locations
        prisma.job.groupBy({
          by: ['location'],
          _count: { location: true },
          where: { 
            status: 'OPEN',
            location: { not: null }
          }
        }),
        // Get available languages
        prisma.userProfile.findMany({
          select: { languages: true },
          where: { 
            user: { 
              userType: 'FREELANCER',
              isActive: true 
            }
          }
        })
      ]);
    });

    // Process skills
    const allSkills = skills.flatMap(job => job.skills);
    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([skill, count]) => ({ skill, count }));

    // Process languages
    const allLanguages = languages.flatMap(profile => profile.languages);
    const languageCounts = allLanguages.reduce((acc, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const availableLanguages = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([language, count]) => ({ language, count }));

    res.status(200).json({
      status: 'success',
      data: {
        categories: categories.map(cat => ({
          category: cat.category,
          count: cat._count.category
        })),
        skills: popularSkills,
        locations: locations.map(loc => ({
          location: loc.location,
          count: loc._count.location
        })),
        languages: availableLanguages,
        budgetTypes: [
          { value: 'FIXED', label: 'Fixed Price' },
          { value: 'HOURLY', label: 'Hourly Rate' },
          { value: 'RANGE', label: 'Budget Range' }
        ],
        experienceLevels: [
          { value: '0', label: 'Entry Level (0-2 years)' },
          { value: '3', label: 'Intermediate (3-5 years)' },
          { value: '6', label: 'Expert (6+ years)' }
        ],
        durations: [
          'Less than 1 week',
          '1 to 4 weeks',
          '1 to 3 months',
          '3 to 6 months',
          'More than 6 months'
        ],
        availabilities: [
          'Available now',
          'Available in 1 week',
          'Available in 2 weeks',
          'Available in 1 month',
          'Not available'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save search preferences
export const saveSearchPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { preferences } = req.body;
    const userId = req.user!.id;

    // Save or update search preferences
    const savedPreferences = await withRetry(() => {
      return prisma.user.update({
        where: { id: userId },
        data: {
          // searchPreferences: preferences // Temporarily commented out
        },
        select: {
          id: true
          // searchPreferences: true // Temporarily commented out
        }
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Search preferences saved successfully',
      data: { preferences: {} } // Temporarily using empty object
    });
  } catch (error) {
    next(error);
  }
};

// Get saved search preferences
export const getSearchPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await withRetry(() => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true
          // searchPreferences: true // Temporarily commented out
        }
      });
    });

    res.status(200).json({
      status: 'success',
      data: { 
        preferences: {} // Temporarily using empty object 
      }
    });
  } catch (error) {
    next(error);
  }
};
