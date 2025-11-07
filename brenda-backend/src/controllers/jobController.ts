import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { createHash } from 'crypto';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { generateJobMatchAnalysis, generateApplicantComparison } from '../services/aiService';

interface ApplicantAnalysisData {
  userId: string;
  name: string;
  headline?: string | null;
  availability?: string | null;
  hourlyRate?: number | null;
  experienceYears?: number | null;
  languages: string[];
  primarySkills: string[];
  resumeHighlights: string[];
  recentProjects: string[];
  achievements: string[];
  matchScore: number;
  skillMatchPercent: number;
  skillOverlapCount: number;
  overlappingSkills: string[];
  proposedRate?: number | null;
  estimatedDuration?: string | null;
  proposalId: string;
  submittedAt: Date;
  proposalSummary?: string | null;
  resumeUpdatedAt?: Date | null;
  coverLetterStructured?: any;
  coverLetterCharCount?: number;
}

type SuitabilityLevel = 'Excellent' | 'Good' | 'Moderate' | 'Limited';

interface ApplicantInsightSummary {
  userId: string;
  summary: string;
  pros: string[];
  cons: string[];
  recommendedFocus: string;
  suitability: SuitabilityLevel;
}

interface ApplicantInsightsResult {
  overallSummary: string;
  comparisonNotes: string[];
  applicants: ApplicantInsightSummary[];
}

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

const buildFreelancerSnapshot = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bio: true,
      profile: {
        select: {
          title: true,
          availability: true,
          experience: true,
          hourlyRate: true,
          languages: true,
          skills: true,
          resumeSkills: true,
          resumeExperience: true,
          resumeProjects: true,
          resumeAchievements: true,
          resumeText: true,
          resumeUploadedAt: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const profile = user.profile;
  if (!profile) {
    return {
      user,
      skills: [],
      languages: [],
      experienceEntries: [],
      projectEntries: [],
      achievementEntries: [],
      resumeHighlights: [],
      profileInput: null
    };
  }

  const combinedSkills = uniqueStringArray([
    ...(profile.skills ?? []),
    ...(Array.isArray(profile.resumeSkills) ? profile.resumeSkills : [])
  ]);

  const languages = uniqueStringArray(profile.languages ?? [], 16);
  const experienceEntries = normalizeProfileEntryArray(profile.resumeExperience as any);
  const projectEntries = normalizeProfileEntryArray(profile.resumeProjects as any);
  const achievementEntries = normalizeProfileEntryArray(profile.resumeAchievements as any);

  const resumeHighlights = [...experienceEntries, ...projectEntries]
    .slice(0, 6)
    .map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`);

  const profileInput = {
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
    title: profile.title || undefined,
    bio: user.bio || undefined,
    availability: profile.availability || undefined,
    skills: combinedSkills,
    languages,
    experienceHighlights: experienceEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    projectHighlights: projectEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    achievementHighlights: achievementEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
    resumeText: profile.resumeText || undefined,
  };

  return {
    user,
    profile,
    skills: combinedSkills,
    languages,
    experienceEntries,
    projectEntries,
    achievementEntries,
    resumeHighlights,
    profileInput
  };
};

const computeMatchScoreFromSkills = (jobSkills: string[], freelancerSkills: string[]) => {
  const jobSkillSet = new Set((jobSkills ?? []).map((skill) => skill.toLowerCase()));
  const freelancerSkillSet = new Set((freelancerSkills ?? []).map((skill) => skill.toLowerCase()));

  if (jobSkillSet.size === 0 && freelancerSkillSet.size === 0) {
    return {
      score: 45,
      overlapCount: 0,
      overlapPercent: 0,
      overlappingSkills: [] as string[]
    };
  }

  const overlapping: string[] = [];
  jobSkillSet.forEach((skill) => {
    if (freelancerSkillSet.has(skill)) {
      overlapping.push(skill);
    }
  });

  const overlapCount = overlapping.length;
  const overlapPercent = jobSkillSet.size > 0 ? (overlapCount / jobSkillSet.size) * 100 : 45;

  let rawScore = overlapPercent;
  if (overlapCount === jobSkillSet.size && jobSkillSet.size > 0) {
    rawScore = 94;
  } else if (overlapCount === 0 && jobSkillSet.size > 0) {
    rawScore = 20;
  } else if (jobSkillSet.size === 0) {
    rawScore = 45;
  }

  const score = clampValueToPercentage(Math.round(rawScore / 5) * 5);

  return {
    score,
    overlapCount,
    overlapPercent: Number.isFinite(overlapPercent) ? overlapPercent : 0,
    overlappingSkills: overlapping
  };
};

const buildApplicantComparisonFallback = (jobTitle: string, applicants: ApplicantAnalysisData[]): ApplicantInsightsResult => {
  if (!applicants.length) {
    return {
      overallSummary: 'No applicants submitted comparable data yet.',
      comparisonNotes: [],
      applicants: []
    };
  }

  const sortedByMatch = [...applicants].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  const best = sortedByMatch[0];
  const lowestRateCandidate = applicants
    .filter((item) => typeof item.proposedRate === 'number')
    .sort((a, b) => (a.proposedRate ?? Infinity) - (b.proposedRate ?? Infinity))[0] || null;
  const fastestCandidate = applicants
    .filter((item) => item.estimatedDuration)
    .sort((a, b) => getDurationRank(a.estimatedDuration) - getDurationRank(b.estimatedDuration))[0] || null;
  const mostExperienced = applicants
    .filter((item) => typeof item.experienceYears === 'number')
    .sort((a, b) => (b.experienceYears ?? 0) - (a.experienceYears ?? 0))[0] || null;

  const overallSummaryParts: string[] = [];
  if (best) {
    overallSummaryParts.push(`${best.name} currently leads the field for ${jobTitle} with a match score of ${best.matchScore}%`);
  }
  if (lowestRateCandidate && (!best || lowestRateCandidate.userId !== best.userId)) {
    overallSummaryParts.push(`${lowestRateCandidate.name} offers the most budget-friendly proposal${lowestRateCandidate.proposedRate != null ? ` at $${Math.round(lowestRateCandidate.proposedRate)}` : ''}.`);
  }
  if (fastestCandidate && (!best || fastestCandidate.userId !== best.userId)) {
    overallSummaryParts.push(`${fastestCandidate.name} projects the quickest delivery (${fastestCandidate.estimatedDuration || 'timeline not specified'}).`);
  }
  if (overallSummaryParts.length === 0) {
    overallSummaryParts.push('Applicants show similar profiles; compare proposed cost and delivery timelines to differentiate.');
  }

  const suitabilityFromScore = (score: number): SuitabilityLevel => {
    if (!Number.isFinite(score)) return 'Moderate';
    if (score >= 75) return 'Excellent';
    if (score >= 55) return 'Good';
    if (score >= 35) return 'Moderate';
    return 'Limited';
  };

  const buildPros = (applicant: ApplicantAnalysisData) => {
    const pros: string[] = [];
    if (applicant.matchScore >= 60) pros.push('Strong skill/job alignment');
    if (applicant.proposedRate != null && lowestRateCandidate && applicant.userId === lowestRateCandidate.userId) pros.push('Most competitive proposal cost');
    if (applicant.estimatedDuration && fastestCandidate && applicant.userId === fastestCandidate.userId) pros.push(`Fastest timeline (${applicant.estimatedDuration})`);
    if (applicant.experienceYears != null && mostExperienced && applicant.userId === mostExperienced.userId) pros.push('Highest reported experience');
    if (applicant.overlappingSkills.length > 0) pros.push(`${applicant.overlappingSkills.length} shared skill(s)`);
    return pros.slice(0, 3);
  };

  const buildCons = (applicant: ApplicantAnalysisData) => {
    const cons: string[] = [];
    if (applicant.overlappingSkills.length === 0) cons.push('No overlap with listed job skills');
    if (applicant.matchScore < 40) cons.push('Weak overall alignment');
    if (applicant.proposedRate == null) cons.push('Proposal cost not provided');
    if (!applicant.estimatedDuration) cons.push('Timeline missing');
    if ((applicant.coverLetterCharCount ?? 0) < 300) cons.push('Proposal lacks detail');
    return cons.slice(0, 3);
  };

  const comparisonNotes: string[] = [];
  comparisonNotes.push(`Top match: ${best ? `${best.name} (${best.matchScore}%)` : 'N/A'}.`);
  if (lowestRateCandidate) {
    comparisonNotes.push(`Lowest cost: ${lowestRateCandidate.name}${lowestRateCandidate.proposedRate != null ? ` ($${Math.round(lowestRateCandidate.proposedRate)})` : ''}.`);
  }
  if (fastestCandidate) {
    comparisonNotes.push(`Fastest delivery: ${fastestCandidate.name} (${fastestCandidate.estimatedDuration || 'N/A'}).`);
  }
  if (mostExperienced) {
    comparisonNotes.push(`Most experience: ${mostExperienced.name}${mostExperienced.experienceYears != null ? ` (${mostExperienced.experienceYears} yrs)` : ''}.`);
  }
  comparisonNotes.push('Review cover-letter snapshots for project-specific insights.');

  return {
    overallSummary: overallSummaryParts.join(' '),
    comparisonNotes,
    applicants: applicants.map((applicant) => ({
      userId: applicant.userId,
      summary: `${applicant.name}: ${applicant.matchScore}% match${applicant.overlappingSkills.length ? `, ${applicant.overlappingSkills.length} shared skills` : ''}${applicant.proposedRate != null ? `, proposes $${Math.round(applicant.proposedRate)}` : ''}${applicant.estimatedDuration ? `, timeline ${applicant.estimatedDuration}` : ''}.`,
      pros: buildPros(applicant),
      cons: buildCons(applicant),
      recommendedFocus: applicant.overlappingSkills.length
        ? 'Validate shared skills through hands-on examples and confirm availability.'
        : 'Request concrete examples that map to the job requirements.',
      suitability: suitabilityFromScore(applicant.matchScore)
    }))
  };
};

const mergeApplicantInsights = (aiResult: any, fallback: ApplicantInsightsResult): ApplicantInsightsResult => {
  if (!aiResult || typeof aiResult !== 'object') {
    return fallback;
  }

  const normalizedApplicants = Array.isArray(aiResult.applicants) ? aiResult.applicants : [];
  const map = new Map(normalizedApplicants.map((entry: any) => [entry?.userId, entry]));

  const mergedApplicants: ApplicantInsightSummary[] = fallback.applicants.map((entry): ApplicantInsightSummary => {
    const override = map.get(entry.userId) as Partial<ApplicantInsightSummary> | undefined;
    const prosArray = Array.isArray(override?.pros) ? (override?.pros as unknown[]) : [];
    const consArray = Array.isArray(override?.cons) ? (override?.cons as unknown[]) : [];
    const overridePros = prosArray.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    const overrideCons = consArray.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

    return {
      userId: entry.userId,
      summary: typeof override?.summary === 'string' && override.summary.trim().length > 0 ? override.summary.trim() : entry.summary,
      pros: overridePros.length ? overridePros.slice(0, 3) : entry.pros,
      cons: overrideCons.length ? overrideCons.slice(0, 3) : entry.cons,
      recommendedFocus: typeof override?.recommendedFocus === 'string' && override.recommendedFocus.trim().length > 0 ? override.recommendedFocus.trim() : entry.recommendedFocus,
      suitability: override?.suitability || entry.suitability,
    };
  });

  return {
    overallSummary: typeof aiResult.overallSummary === 'string' && aiResult.overallSummary.trim().length > 0
      ? aiResult.overallSummary.trim()
      : fallback.overallSummary,
    comparisonNotes: Array.isArray(aiResult.comparisonNotes) && aiResult.comparisonNotes.length > 0
      ? aiResult.comparisonNotes.slice(0, 5)
      : fallback.comparisonNotes,
    applicants: mergedApplicants
  };
};

const clampValueToPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const DURATION_PRIORITY: Record<string, number> = {
  'Less than 1 week': 1,
  '1 to 4 weeks': 2,
  '1 to 3 months': 3,
  '3 to 6 months': 4,
  'More than 6 months': 5
};

const getDurationRank = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const normalized = value.trim();
  return DURATION_PRIORITY[normalized] ?? Number.POSITIVE_INFINITY;
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

export const getJobApplicantAnalysis = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.userType !== 'CLIENT') {
      const response: ApiResponse = {
        success: false,
        message: 'Only clients can access applicant comparisons'
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true }
        },
        proposals: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                bio: true,
                profile: {
                  select: {
                    title: true,
                    availability: true,
                    experience: true,
                    hourlyRate: true,
                    languages: true,
                    skills: true,
                    resumeSkills: true,
                    resumeExperience: true,
                    resumeProjects: true,
                    resumeAchievements: true,
                    resumeText: true,
                    resumeUploadedAt: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
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

    if (job.owner?.id !== req.user.id) {
      const response: ApiResponse = {
        success: false,
        message: 'You do not have permission to view this analysis'
      };
      res.status(403).json(response);
      return;
    }

    if (job.proposals.length === 0) {
      const response: ApiResponse = {
        success: true,
        message: 'No proposals submitted yet',
        data: {
          applicants: [],
          metrics: null,
          aiInsights: null
        }
      };
      res.status(200).json(response);
      return;
    }

    const jobSkills = Array.isArray(job.skills) ? (job.skills as string[]) : [];

    const applicantSnapshots = await Promise.all(job.proposals.map(async (proposal) => {
      const snapshot = await buildFreelancerSnapshot(proposal.author.id);
      return {
        proposal,
        snapshot
      };
    }));

    const applicantsData: ApplicantAnalysisData[] = applicantSnapshots
      .filter((item): item is typeof item & { snapshot: NonNullable<typeof item.snapshot> } => Boolean(item.snapshot))
      .map((item) => {
        const { proposal, snapshot } = item;
        const freelancerSkills = snapshot.skills;
        const matchSummary = computeMatchScoreFromSkills(jobSkills, freelancerSkills);

        const hourlyRate = snapshot.profile?.hourlyRate ?? null;
        const experienceYears = snapshot.profile?.experience ?? null;
        const rawCoverLetter = typeof proposal.coverLetter === 'string' ? proposal.coverLetter : '';
        const coverLetterStructured = proposal.coverLetterJson && typeof proposal.coverLetterJson === 'object'
          ? proposal.coverLetterJson
          : null;
        const proposedRate = typeof proposal.proposedRate === 'number' ? proposal.proposedRate : null;
        const estimatedDuration = typeof proposal.estimatedDuration === 'string' && proposal.estimatedDuration.trim().length > 0
          ? proposal.estimatedDuration.trim()
          : null;

        return {
          userId: snapshot.user.id,
          name: [snapshot.user.firstName, snapshot.user.lastName].filter(Boolean).join(' '),
          headline: snapshot.profile?.title || null,
          availability: snapshot.profile?.availability || null,
          hourlyRate,
          experienceYears,
          languages: snapshot.languages,
          primarySkills: freelancerSkills.slice(0, 20),
          resumeHighlights: snapshot.resumeHighlights,
          recentProjects: snapshot.projectEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
          achievements: snapshot.achievementEntries.map((entry) => `${entry.title}${entry.description ? `: ${entry.description}` : ''}`),
          matchScore: matchSummary.score,
          skillMatchPercent: matchSummary.overlapPercent,
          skillOverlapCount: matchSummary.overlapCount,
          overlappingSkills: matchSummary.overlappingSkills,
          proposedRate,
          estimatedDuration,
          proposalId: proposal.id,
          submittedAt: proposal.createdAt,
          proposalSummary: proposal.coverLetter
            ? proposal.coverLetter.split('\n').slice(0, 4).join(' ').slice(0, 400)
            : null,
          resumeUpdatedAt: snapshot.profile?.resumeUploadedAt || null,
          coverLetterStructured,
          coverLetterCharCount: rawCoverLetter.length
        } as ApplicantAnalysisData;
      });

    if (applicantsData.length === 0) {
      const response: ApiResponse = {
        success: true,
        message: 'No eligible applicant data available',
        data: {
          applicants: [],
          metrics: null,
          aiInsights: null
        }
      };
      res.status(200).json(response);
      return;
    }

    const matchScores = applicantsData.map((item) => item.matchScore);
    const proposedRates = applicantsData
      .map((item) => item.proposedRate)
      .filter((value): value is number => typeof value === 'number');
    const experienceValues = applicantsData
      .map((item) => item.experienceYears)
      .filter((value): value is number => typeof value === 'number');
    const skillPercents = applicantsData.map((item) => item.skillMatchPercent);
    const durationEntries = applicantsData.map((item) => ({
      userId: item.userId,
      name: item.name,
      duration: item.estimatedDuration,
      rank: getDurationRank(item.estimatedDuration)
    }));

    const average = (values: number[]) => (values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : 0);

    let bestMatchCandidate: ApplicantAnalysisData | null = null;
    let lowestRateCandidate: ApplicantAnalysisData | null = null;
    let mostExperiencedCandidate: ApplicantAnalysisData | null = null;
    let fastestDeliveryCandidate: ApplicantAnalysisData | null = null;

    for (const candidate of applicantsData) {
      if (!bestMatchCandidate || candidate.matchScore > bestMatchCandidate.matchScore) {
        bestMatchCandidate = candidate;
      }
      if (candidate.proposedRate != null) {
        if (!lowestRateCandidate || (candidate.proposedRate ?? Infinity) < (lowestRateCandidate.proposedRate ?? Infinity)) {
          lowestRateCandidate = candidate;
        }
      }
      if (candidate.experienceYears != null) {
        if (!mostExperiencedCandidate || (candidate.experienceYears ?? 0) > (mostExperiencedCandidate.experienceYears ?? 0)) {
          mostExperiencedCandidate = candidate;
        }
      }
      if (candidate.estimatedDuration) {
        if (!fastestDeliveryCandidate || getDurationRank(candidate.estimatedDuration) < getDurationRank(fastestDeliveryCandidate.estimatedDuration)) {
          fastestDeliveryCandidate = candidate;
        }
      }
    }

    const metrics = {
      counts: {
        applicants: applicantsData.length,
        withProposedRate: proposedRates.length,
        withExperience: experienceValues.length,
        withDuration: applicantsData.filter((item) => Boolean(item.estimatedDuration)).length
      },
      averages: {
        matchScore: average(matchScores),
        proposedRate: proposedRates.length ? average(proposedRates) : null,
        experienceYears: experienceValues.length ? average(experienceValues) : null,
        skillMatchPercent: average(skillPercents)
      },
      extremes: {
        bestMatch: bestMatchCandidate?.userId ?? null,
        lowestRate: lowestRateCandidate?.userId ?? null,
        fastestDelivery: fastestDeliveryCandidate?.userId ?? null,
        mostExperienced: mostExperiencedCandidate?.userId ?? null
      },
      charts: {
        matchScoreDistribution: applicantsData.map((item) => ({ userId: item.userId, name: item.name, value: item.matchScore })),
        skillMatchDistribution: applicantsData.map((item) => ({ userId: item.userId, name: item.name, value: item.skillMatchPercent })),
        proposedRateDistribution: applicantsData.filter((item) => typeof item.proposedRate === 'number').map((item) => ({ userId: item.userId, name: item.name, value: item.proposedRate! })),
        experienceDistribution: applicantsData.filter((item) => typeof item.experienceYears === 'number').map((item) => ({ userId: item.userId, name: item.name, value: item.experienceYears! })),
        durationDistribution: durationEntries.map((entry) => ({
          userId: entry.userId,
          name: entry.name,
          value: Number.isFinite(entry.rank) ? entry.rank : null,
          label: entry.duration || 'Not provided'
        }))
      }
    };

    const fallbackInsights = buildApplicantComparisonFallback(job.title, applicantsData);

    const aiInsightsRaw = await generateApplicantComparison({
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      subcategory: job.subcategory,
      skills: jobSkills,
      budget: job.budget,
      budgetType: job.budgetType,
      duration: job.duration,
      location: job.location,
      isRemote: job.isRemote
    }, applicantsData.map((item) => ({
      userId: item.userId,
      name: item.name,
      headline: item.headline || undefined,
      hourlyRate: item.hourlyRate,
      experienceYears: item.experienceYears,
      availability: item.availability,
      languages: item.languages,
      primarySkills: item.primarySkills,
      resumeHighlights: item.resumeHighlights,
      recentProjects: item.recentProjects,
      achievements: item.achievements,
      matchScore: item.matchScore,
      skillMatchPercent: item.skillMatchPercent,
      skillOverlapCount: item.skillOverlapCount,
      overlappingSkills: item.overlappingSkills,
      proposedRate: item.proposedRate,
      estimatedDuration: item.estimatedDuration,
      proposalSummary: item.proposalSummary || undefined,
      coverLetterSummary: Array.isArray(item.coverLetterStructured?.sections)
        ? (item.coverLetterStructured.sections as any[])
            .map((section) => {
              if (!section) return null;
              const heading = typeof section.heading === 'string' ? section.heading : 'Section';
              const text = typeof section.text === 'string' ? section.text.slice(0, 160) : '';
              return `${heading}: ${text}`.trim();
            })
            .filter(Boolean)
            .join('\n')
        : undefined,
      coverLetterLength: item.coverLetterCharCount
    })));

    const aiInsights = mergeApplicantInsights(aiInsightsRaw, fallbackInsights);

    const response: ApiResponse = {
      success: true,
      message: 'Applicant analysis generated successfully',
      data: {
        applicants: applicantsData,
        metrics,
        aiInsights
      }
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
