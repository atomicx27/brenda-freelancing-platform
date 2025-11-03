import { Request, Response, NextFunction } from 'express';
import {
  enhanceJobDescription,
  enhanceProposal,
  generateJobSuggestions,
  analyzeProposal,
  generateCoverLetter,
  suggestForumPost,
} from '../services/aiService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: string;
  };
}

/**
 * Enhance job description using AI
 * POST /api/ai/enhance-job-description
 */
export const enhanceJobDescriptionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
  const { title, description, category, skills, budget, duration, minWords, maxWords } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const enhancedDescription = await enhanceJobDescription({
      title,
      description,
      category,
      skills,
      budget,
      duration,
      minWords: typeof minWords === 'number' ? minWords : minWords ? parseInt(minWords, 10) : undefined,
      maxWords: typeof maxWords === 'number' ? maxWords : maxWords ? parseInt(maxWords, 10) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: {
        original: description,
        enhanced: enhancedDescription,
      },
    });
  } catch (error: any) {
    console.error('Error in enhanceJobDescriptionHandler:', error);
    return next(error);
  }
};

/**
 * Enhance proposal using AI
 * POST /api/ai/enhance-proposal
 */
export const enhanceProposalHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
  const { jobTitle, jobDescription, proposal, freelancerSkills, freelancerExperience, minWords, maxWords } = req.body;

    // Validate required fields
    if (!jobTitle || !jobDescription || !proposal) {
      return res.status(400).json({
        success: false,
        message: 'Job title, job description, and proposal are required',
      });
    }

    const enhancedProposal = await enhanceProposal({
      jobTitle,
      jobDescription,
      originalProposal: proposal,
      freelancerSkills,
      freelancerExperience,
      minWords: typeof minWords === 'number' ? minWords : minWords ? parseInt(minWords, 10) : undefined,
      maxWords: typeof maxWords === 'number' ? maxWords : maxWords ? parseInt(maxWords, 10) : undefined,
    });

    return res.status(200).json({
      success: true,
      data: {
        original: proposal,
        enhanced: enhancedProposal,
      },
    });
  } catch (error: any) {
    console.error('Error in enhanceProposalHandler:', error);
    return next(error);
  }
};

/**
 * Generate job suggestions based on title and category
 * POST /api/ai/job-suggestions
 */
export const generateJobSuggestionsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
    }

    const suggestions = await generateJobSuggestions(title, category);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error('Error in generateJobSuggestionsHandler:', error);
    return next(error);
  }
};

/**
 * Analyze proposal and provide feedback
 * POST /api/ai/analyze-proposal
 */
export const analyzeProposalHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { proposal, jobDescription } = req.body;

    if (!proposal || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Proposal and job description are required',
      });
    }

    const analysis = await analyzeProposal(proposal, jobDescription);

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('Error in analyzeProposalHandler:', error);
    return next(error);
  }
};

/**
 * Generate cover letter
 * POST /api/ai/generate-cover-letter
 */
export const generateCoverLetterHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobTitle, jobDescription, freelancerName, freelancerSkills, freelancerExperience } = req.body;

    if (!jobTitle || !jobDescription || !freelancerName) {
      return res.status(400).json({
        success: false,
        message: 'Job title, job description, and freelancer name are required',
      });
    }

    const coverLetter = await generateCoverLetter(
      jobTitle,
      jobDescription,
      freelancerName,
      freelancerSkills || [],
      freelancerExperience || ''
    );

    return res.status(200).json({
      success: true,
      data: {
        coverLetter,
      },
    });
  } catch (error: any) {
    console.error('Error in generateCoverLetterHandler:', error);
    return next(error);
  }
};

/**
 * Suggest a forum post using AI
 * POST /api/ai/suggest-forum-post
 */
export const suggestForumPostHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, category, context } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
    }

    const suggestion = await suggestForumPost(title, category, context || '');

    return res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error: any) {
    console.error('Error in suggestForumPostHandler:', error);
    return next(error);
  }
};
