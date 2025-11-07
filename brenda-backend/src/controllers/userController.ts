import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { deleteCloudinaryAsset, uploadResumeDocument } from '../services/cloudinaryService';
import { parseResume } from '../services/resumeParser';
import { suggestProfileFields } from '../services/aiService';

const sanitizeProfileEntries = (entries: any): { title: string; description: string }[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry) {
        return null;
      }

      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (!trimmed) return null;
        return { title: trimmed, description: '' };
      }

      const title = typeof entry.title === 'string' ? entry.title.trim() : '';
      const description = typeof entry.description === 'string' ? entry.description.trim() : '';

      if (!title && !description) {
        return null;
      }

      return {
        title: title || description,
        description
      };
    })
    .filter((value): value is { title: string; description: string } => Boolean(value))
    .slice(0, 12);
};

const sanitizeStringList = (input: unknown, limit = 32): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of input) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
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

// Validation rules for profile update
export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  body('languages.*')
    .optional()
    .isString()
    .withMessage('Each language must be a string'),
  body('experienceEntries')
    .optional()
    .isArray()
    .withMessage('Experience entries must be an array'),
  body('experienceEntries.*.title')
    .optional()
    .isString()
    .withMessage('Experience title must be a string'),
  body('experienceEntries.*.description')
    .optional()
    .isString()
    .withMessage('Experience description must be a string'),
  body('projectEntries')
    .optional()
    .isArray()
    .withMessage('Project entries must be an array'),
  body('projectEntries.*.title')
    .optional()
    .isString()
    .withMessage('Project title must be a string'),
  body('projectEntries.*.description')
    .optional()
    .isString()
    .withMessage('Project description must be a string'),
  body('achievementEntries')
    .optional()
    .isArray()
    .withMessage('Achievement entries must be an array'),
  body('achievementEntries.*.title')
    .optional()
    .isString()
    .withMessage('Achievement title must be a string'),
  body('achievementEntries.*.description')
    .optional()
    .isString()
    .withMessage('Achievement description must be a string')
];

// Get user profile
export const getUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    const {
      firstName,
      lastName,
      bio,
      location,
      website,
      phone,
      linkedin,
      github,
      twitter,
      // Profile specific fields
      title,
      company,
      experience,
      hourlyRate,
      availability,
      skills,
      languages,
      experienceEntries,
      projectEntries,
      achievementEntries
    } = req.body;

    const experienceEntriesProvided = Object.prototype.hasOwnProperty.call(req.body, 'experienceEntries');
    const projectEntriesProvided = Object.prototype.hasOwnProperty.call(req.body, 'projectEntries');
    const achievementEntriesProvided = Object.prototype.hasOwnProperty.call(req.body, 'achievementEntries');

    const sanitizedExperienceEntries = experienceEntriesProvided ? sanitizeProfileEntries(experienceEntries) : undefined;
    const sanitizedProjectEntries = projectEntriesProvided ? sanitizeProfileEntries(projectEntries) : undefined;
    const sanitizedAchievementEntries = achievementEntriesProvided ? sanitizeProfileEntries(achievementEntries) : undefined;

    // Update user basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(phone !== undefined && { phone }),
        ...(linkedin !== undefined && { linkedin }),
        ...(github !== undefined && { github }),
        ...(twitter !== undefined && { twitter })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        website: true,
        linkedin: true,
        github: true,
        twitter: true,
        updatedAt: true
      }
    });

    const shouldUpdateProfile = req.user!.userType === 'FREELANCER' && (
      title !== undefined ||
      company !== undefined ||
      experience !== undefined ||
      hourlyRate !== undefined ||
      availability !== undefined ||
      skills !== undefined ||
      languages !== undefined ||
      experienceEntriesProvided ||
      projectEntriesProvided ||
      achievementEntriesProvided
    );

    if (shouldUpdateProfile) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...(title !== undefined && { title }),
          ...(company !== undefined && { company }),
          ...(experience !== undefined && { experience }),
          ...(hourlyRate !== undefined && { hourlyRate }),
          ...(availability !== undefined && { availability }),
          ...(skills !== undefined && { skills }),
          ...(languages !== undefined && { languages }),
          resumeExperience: (sanitizedExperienceEntries ?? []) as Prisma.JsonArray,
          resumeProjects: (sanitizedProjectEntries ?? []) as Prisma.JsonArray,
          resumeAchievements: (sanitizedAchievementEntries ?? []) as Prisma.JsonArray
        },
        create: {
          userId,
          ...(title && { title }),
          ...(company && { company }),
          ...(experience && { experience }),
          ...(hourlyRate && { hourlyRate }),
          ...(availability && { availability }),
          ...(skills && { skills }),
          ...(languages && { languages }),
          resumeExperience: (sanitizedExperienceEntries ?? []) as Prisma.JsonArray,
          resumeProjects: (sanitizedProjectEntries ?? []) as Prisma.JsonArray,
          resumeAchievements: (sanitizedAchievementEntries ?? []) as Prisma.JsonArray,
          resumeSkills: []
        }
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Upload resume for freelancer
export const uploadResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        message: 'No resume file uploaded'
      };
      res.status(400).json(response);
      return;
    }

    if (req.user!.userType !== 'FREELANCER') {
      const response: ApiResponse = {
        success: false,
        message: 'Only freelancers can upload resumes'
      };
      res.status(403).json(response);
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      const response: ApiResponse = {
        success: false,
        message: 'Resume must be a PDF file'
      };
      res.status(400).json(response);
      return;
    }

    const userId = req.user!.id;
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        website: true,
        linkedin: true,
        github: true,
        bio: true
      }
    });

    const existingExperienceEntries = sanitizeProfileEntries(existingProfile?.resumeExperience as any);
    const existingProjectEntries = sanitizeProfileEntries(existingProfile?.resumeProjects as any);
    const existingAchievementEntries = sanitizeProfileEntries(existingProfile?.resumeAchievements as any);

    if (existingProfile?.resumePublicId) {
      try {
        await deleteCloudinaryAsset(existingProfile.resumePublicId, 'raw');
      } catch (error) {
        console.warn(`Failed to delete previous resume for user ${userId}:`, (error as Error)?.message || error);
      }
    }

    const uploadResult = await uploadResumeDocument(req.file.buffer, req.file.originalname);
    const parsedResume = await parseResume(req.file.buffer);

    const parsedExperienceEntries = sanitizeProfileEntries(parsedResume.experience);
    const parsedProjectEntries = sanitizeProfileEntries(parsedResume.projects);
    const parsedAchievementEntries = sanitizeProfileEntries(parsedResume.achievements);

    let suggestions = null;
    try {
      suggestions = await suggestProfileFields({
        resumeText: parsedResume.text.slice(0, 8000),
        parsedResume,
        existingProfile: {
          bio: existingUser?.bio || req.user?.bio || null,
          title: existingProfile?.title || null,
          company: existingProfile?.company || null,
          availability: existingProfile?.availability || null,
          skills: existingProfile?.skills || [],
          languages: existingProfile?.languages || [],
          website: existingUser?.website || null,
          linkedin: existingUser?.linkedin || null,
          github: existingUser?.github || null
        }
      });
    } catch (error) {
      console.error('Failed to get profile suggestions from AI:', error);
    }

    const autoFilledFieldSet = new Set<string>();

    const suggestionSkills = sanitizeStringList(suggestions?.skills);
    const suggestionLanguages = sanitizeStringList(suggestions?.languages);
    const parsedSkills = sanitizeStringList(parsedResume.skills);
    const skillsToApply = suggestionSkills.length > 0 ? suggestionSkills : parsedSkills;
    const languagesToApply = suggestionLanguages;

    const experienceSuggestions = sanitizeProfileEntries(suggestions?.experience);
    const projectSuggestions = sanitizeProfileEntries(suggestions?.projects);
    const achievementSuggestions = sanitizeProfileEntries(suggestions?.achievements);

    const experienceEntriesCandidate = experienceSuggestions.length > 0 ? experienceSuggestions : parsedExperienceEntries;
    const projectEntriesCandidate = projectSuggestions.length > 0 ? projectSuggestions : parsedProjectEntries;
    const achievementEntriesCandidate = achievementSuggestions.length > 0 ? achievementSuggestions : parsedAchievementEntries;

    const primaryWebsite = suggestions?.website || parsedResume.websites?.find((url) => !url.toLowerCase().includes('linkedin.com') && !url.toLowerCase().includes('github.com'));
    const primaryLinkedin = suggestions?.linkedin || parsedResume.linkedinUrls?.[0];
    const primaryGithub = suggestions?.github || parsedResume.githubUrls?.[0];

    const userUpdateData: Prisma.UserUpdateInput = {};
    if (!existingUser?.website && primaryWebsite) {
      userUpdateData.website = primaryWebsite;
      autoFilledFieldSet.add('website');
    }
    if (!existingUser?.linkedin && primaryLinkedin) {
      userUpdateData.linkedin = primaryLinkedin;
      autoFilledFieldSet.add('linkedin');
    }
    if (!existingUser?.github && primaryGithub) {
      userUpdateData.github = primaryGithub;
      autoFilledFieldSet.add('github');
    }
    if (!existingUser?.bio && suggestions?.bio) {
      userUpdateData.bio = suggestions.bio;
      autoFilledFieldSet.add('bio');
    }

    let updatedUser = existingUser;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
        select: {
          website: true,
          linkedin: true,
          github: true,
          bio: true
        }
      });
    }

    if (!updatedUser) {
      updatedUser = {
        website: existingUser?.website ?? null,
        linkedin: existingUser?.linkedin ?? null,
        github: existingUser?.github ?? null,
        bio: existingUser?.bio ?? null
      };
    }

    const profileUpdateData: Prisma.UserProfileUpdateInput = {};

    if (skillsToApply.length > 0) {
      profileUpdateData.skills = skillsToApply;
      autoFilledFieldSet.add('skills');
    }

    if (parsedSkills.length > 0) {
      profileUpdateData.resumeSkills = parsedSkills;
    } else if (skillsToApply.length > 0) {
      profileUpdateData.resumeSkills = skillsToApply;
    }

    if (languagesToApply.length > 0) {
      profileUpdateData.languages = languagesToApply;
      autoFilledFieldSet.add('languages');
    }

    if (experienceEntriesCandidate.length > 0) {
      profileUpdateData.resumeExperience = experienceEntriesCandidate as Prisma.JsonArray;
      autoFilledFieldSet.add('experience');
    }

    if (projectEntriesCandidate.length > 0) {
      profileUpdateData.resumeProjects = projectEntriesCandidate as Prisma.JsonArray;
      autoFilledFieldSet.add('projects');
    }

    if (achievementEntriesCandidate.length > 0) {
      profileUpdateData.resumeAchievements = achievementEntriesCandidate as Prisma.JsonArray;
      autoFilledFieldSet.add('achievements');
    }

    if (suggestions?.title && !existingProfile?.title) {
      profileUpdateData.title = suggestions.title;
      autoFilledFieldSet.add('title');
    }

    if (suggestions?.company && !existingProfile?.company) {
      profileUpdateData.company = suggestions.company;
      autoFilledFieldSet.add('company');
    }

    if (suggestions?.availability && !existingProfile?.availability) {
      profileUpdateData.availability = suggestions.availability;
      autoFilledFieldSet.add('availability');
    }

    const skillsForCreate = skillsToApply.length > 0 ? skillsToApply : existingProfile?.skills ?? [];
    const languagesForCreate = languagesToApply.length > 0 ? languagesToApply : existingProfile?.languages ?? [];
    const resumeSkillsForCreate = parsedSkills.length > 0 ? parsedSkills : (skillsToApply.length > 0 ? skillsToApply : ((existingProfile?.resumeSkills as string[] | null) ?? []));
    const resumeExperienceForCreate = experienceEntriesCandidate.length > 0 ? experienceEntriesCandidate : existingExperienceEntries;
    const resumeProjectsForCreate = projectEntriesCandidate.length > 0 ? projectEntriesCandidate : existingProjectEntries;
    const resumeAchievementsForCreate = achievementEntriesCandidate.length > 0 ? achievementEntriesCandidate : existingAchievementEntries;

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...profileUpdateData,
        resumeUrl: uploadResult.secureUrl,
        resumePublicId: uploadResult.publicId,
        resumeUploadedAt: new Date(),
        resumeText: parsedResume.text
      },
      create: {
        userId,
        resumeUrl: uploadResult.secureUrl,
        resumePublicId: uploadResult.publicId,
        resumeUploadedAt: new Date(),
        resumeText: parsedResume.text,
        skills: skillsForCreate,
        languages: languagesForCreate,
        resumeSkills: resumeSkillsForCreate,
        resumeExperience: resumeExperienceForCreate as Prisma.JsonArray,
        resumeProjects: resumeProjectsForCreate as Prisma.JsonArray,
        resumeAchievements: resumeAchievementsForCreate as Prisma.JsonArray,
        title: suggestions?.title || existingProfile?.title || null,
        company: suggestions?.company || existingProfile?.company || null,
        availability: suggestions?.availability || existingProfile?.availability || null
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: {
        profile: updatedProfile,
        parsedResume,
        user: updatedUser,
        autoFilledFields: Array.from(autoFilledFieldSet)
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get resume information
export const getResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        resumeUrl: true,
        resumeUploadedAt: true,
        resumeSkills: true,
        resumeExperience: true,
        resumeProjects: true,
        resumeAchievements: true
      }
    });

    if (!profile || !profile.resumeUrl) {
      const response: ApiResponse = {
        success: false,
        message: 'Resume not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Resume retrieved successfully',
      data: profile
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get potential mentors
export const getPotentialMentors = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, skills, limit = 20 } = req.query;
    const currentUserId = req.user!.id;

    const where: any = {
      id: { not: currentUserId }, // Exclude current user
      isActive: true,
      // Only show users who have APPROVED mentor applications
      mentorApplication: {
        status: 'APPROVED'
      }
    };

    // If search term provided, search by name or profile title
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { profile: { title: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const mentors = await prisma.user.findMany({
      where,
      take: Number(limit),
      orderBy: [
        { createdAt: 'desc' }
      ],
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
            experience: true,
            hourlyRate: true
          }
        },
        mentorApplication: {
          select: {
            expertise: true,
            experience: true,
            achievements: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Mentors retrieved successfully',
      data: { mentors }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
