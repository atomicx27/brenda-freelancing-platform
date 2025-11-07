import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedResume } from './resumeParser';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());

// Use a widely available, cost-effective text model
// Verified available via REST for this key: models/gemini-2.5-flash
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface EnhanceJobDescriptionInput {
  title: string;
  description: string;
  category?: string;
  skills?: string[];
  budget?: number;
  duration?: string;
  minWords?: number;
  maxWords?: number;
}

interface EnhanceProposalInput {
  jobTitle: string;
  jobDescription: string;
  originalProposal: string;
  freelancerSkills?: string[];
  freelancerExperience?: string;
  minWords?: number;
  maxWords?: number;
}

interface ProfileSuggestionInput {
  resumeText: string;
  parsedResume: ParsedResume;
  existingProfile: {
    bio?: string | null;
    title?: string | null;
    company?: string | null;
    availability?: string | null;
    skills?: string[];
    languages?: string[];
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
  };
}

interface ProfileSuggestionOutput {
  title?: string;
  company?: string;
  bio?: string;
  availability?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  languages?: string[];
  experience?: { title: string; description: string }[];
  projects?: { title: string; description: string }[];
  achievements?: { title: string; description: string }[];
}

interface JobMatchProfileInput {
  name?: string;
  title?: string;
  bio?: string;
  availability?: string;
  skills: string[];
  languages: string[];
  experienceHighlights: string[];
  projectHighlights: string[];
  achievementHighlights: string[];
  resumeText?: string;
}

interface JobMatchJobInput {
  id: string;
  title: string;
  description: string;
  skills: string[];
  category?: string | null;
  subcategory?: string | null;
  budget?: number | null;
  budgetType?: string | null;
  duration?: string | null;
  location?: string | null;
  isRemote?: boolean | null;
  deadline?: string | null;
}

interface JobMatchAnalysisOutput {
  score: number;
  reasoning: string;
  source: 'ai' | 'fallback';
}

interface ApplicantComparisonJobSummary {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  subcategory?: string | null;
  skills: string[];
  budget?: number | null;
  budgetType?: string | null;
  duration?: string | null;
  location?: string | null;
  isRemote?: boolean | null;
}

interface ApplicantComparisonCandidate {
  userId: string;
  name: string;
  headline?: string;
  hourlyRate?: number | null;
  experienceYears?: number | null;
  availability?: string | null;
  languages: string[];
  primarySkills: string[];
  resumeHighlights: string[];
  recentProjects: string[];
  achievements: string[];
  matchScore: number;
  skillMatchPercent: number;
  skillOverlapCount: number;
  overlappingSkills?: string[];
  proposedRate?: number | null;
  estimatedDuration?: string | null;
  proposalSummary?: string;
  coverLetterSummary?: string;
  coverLetterLength?: number;
}

interface ApplicantComparisonResult {
  overallSummary: string;
  comparisonNotes: string[];
  applicants: Array<{
    userId: string;
    summary: string;
    pros: string[];
    cons: string[];
    recommendedFocus: string;
    suitability: 'Excellent' | 'Good' | 'Moderate' | 'Limited';
  }>;
}

const clampScore = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const sanitizeSnippet = (text: string | undefined | null, limit = 1200): string => {
  if (!text) return '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized;
};

const buildFallbackMatches = (profile: JobMatchProfileInput | null, jobs: JobMatchJobInput[]): Record<string, JobMatchAnalysisOutput> => {
  const fallback: Record<string, JobMatchAnalysisOutput> = {};
  const profileSkillSet = new Set((profile?.skills ?? []).map((skill) => skill.toLowerCase()));

  for (const job of jobs) {
    const jobSkills = Array.isArray(job.skills) ? job.skills : [];
    const sharedSkills = jobSkills.filter((skill) => profileSkillSet.has(skill.toLowerCase()));
    const matchRatio = jobSkills.length > 0 ? sharedSkills.length / jobSkills.length : 0;
    let rawScore = matchRatio * 100;

    if (sharedSkills.length === jobSkills.length && jobSkills.length > 0) {
      rawScore = 94;
    } else if (sharedSkills.length === 0 && jobSkills.length > 0) {
      rawScore = 20;
    } else if (jobSkills.length === 0) {
      rawScore = 45;
    }

    const score = clampScore(Math.round(rawScore / 5) * 5);

    const reasoning = sharedSkills.length > 0
      ? `Strong overlap in ${sharedSkills.length}/${jobSkills.length || sharedSkills.length} required skills (${sharedSkills.slice(0, 4).join(', ')}${sharedSkills.length > 4 ? '…' : ''}).`
      : 'Skill requirements differ from your profile. Review the description before applying.';

    fallback[job.id] = {
      score,
      reasoning,
      source: 'fallback'
    };
  }

  return fallback;
};

export async function generateJobMatchAnalysis(
  profile: JobMatchProfileInput | null,
  jobs: JobMatchJobInput[]
): Promise<Record<string, JobMatchAnalysisOutput>> {
  if (!jobs.length) {
    return {};
  }

  const fallback = buildFallbackMatches(profile, jobs);

  if (!profile || profile.skills.length === 0) {
    return fallback;
  }

  try {
    const jobSummaries = jobs.map((job, index) => {
      const budgetSummary = job.budget != null
        ? `${job.budgetType || 'FIXED'} budget ~ ${job.budget}`
        : job.budgetType || 'Budget not specified';

      return `Job ${index + 1}:
ID: ${job.id}
Title: ${job.title}
Category: ${job.category || 'N/A'}
Subcategory: ${job.subcategory || 'N/A'}
Skills: ${job.skills.join(', ') || 'Not listed'}
Duration: ${job.duration || 'N/A'}
Location: ${job.location || 'N/A'}
Remote: ${job.isRemote ? 'Yes' : 'No'}
Deadline: ${job.deadline || 'N/A'}
Budget: ${budgetSummary}
Summary: ${sanitizeSnippet(job.description, 900)}`;
    }).join('\n\n');

    const profileSummary = `Name: ${profile.name || 'N/A'}
Title: ${profile.title || 'N/A'}
Availability: ${profile.availability || 'N/A'}
Core Skills: ${profile.skills.join(', ') || 'None listed'}
Languages: ${profile.languages.join(', ') || 'Not specified'}
Bio: ${sanitizeSnippet(profile.bio, 400)}
Experience Highlights: ${profile.experienceHighlights.length ? profile.experienceHighlights.map((item) => `- ${sanitizeSnippet(item, 220)}`).join('\n') : 'None provided'}
Project Highlights: ${profile.projectHighlights.length ? profile.projectHighlights.map((item) => `- ${sanitizeSnippet(item, 220)}`).join('\n') : 'None provided'}
Achievements: ${profile.achievementHighlights.length ? profile.achievementHighlights.map((item) => `- ${sanitizeSnippet(item, 220)}`).join('\n') : 'None provided'}
Resume Summary: ${sanitizeSnippet(profile.resumeText, 1800)}`;

    const prompt = `You are an AI assistant that evaluates how well a freelancer's profile matches a set of job postings.
Score each job from 0-100 (integer) and provide a concise reason (max 40 words) referencing the strongest evidence (skills, domain experience, seniority, availability, etc.).
Higher scores should only be assigned when there is clear alignment. Use lower scores when skills or experience are missing.

Return ONLY a JSON array. Each array element must follow this structure exactly:
{
  "jobId": "<job id>",
  "matchScore": <integer 0-100>,
  "reasoning": "short explanation"
}

Freelancer Profile:
${profileSummary}

Jobs to evaluate:
${jobSummaries}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return fallback;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const enriched: Record<string, JobMatchAnalysisOutput> = { ...fallback };

    for (const entry of parsed) {
      const jobId = typeof entry?.jobId === 'string' ? entry.jobId : undefined;
      if (!jobId || !fallback[jobId]) {
        continue;
      }

      const numericScore = clampScore(Number(entry.matchScore ?? entry.score ?? entry.percentage));
      const reasoning = typeof entry.reasoning === 'string' && entry.reasoning.trim().length > 0
        ? entry.reasoning.trim()
        : fallback[jobId].reasoning;

      enriched[jobId] = {
        score: numericScore,
        reasoning,
        source: 'ai'
      };
    }

    return enriched;
  } catch (error) {
    console.error('Error generating job match analysis with AI:', error);
    return fallback;
  }
}

export async function generateApplicantComparison(
  job: ApplicantComparisonJobSummary,
  applicants: ApplicantComparisonCandidate[]
): Promise<ApplicantComparisonResult | null> {
  if (!applicants.length) {
    return null;
  }

  try {
    const jobSnippet = `Job Title: ${job.title}
Category: ${job.category || 'N/A'}
Subcategory: ${job.subcategory || 'N/A'}
Skills Required: ${job.skills.join(', ') || 'Not specified'}
Budget: ${job.budget != null ? `${job.budgetType || 'FIXED'} ${job.budget}` : job.budgetType || 'Not specified'}
Duration: ${job.duration || 'Not specified'}
Location: ${job.location || 'Not specified'}
Remote: ${job.isRemote ? 'Yes' : 'No'}
Summary: ${sanitizeSnippet(job.description, 1200)}`;

    const applicantSummaries = applicants.map((applicant, index) => {
      const percent = Number.isFinite(applicant.skillMatchPercent) ? `${Math.round(applicant.skillMatchPercent)}%` : 'N/A';

      return `Applicant ${index + 1}:
ID: ${applicant.userId}
Name: ${applicant.name}
Headline: ${applicant.headline || 'N/A'}
Match Score: ${Math.round(applicant.matchScore)} / 100
Skill Match: ${percent} (${applicant.skillOverlapCount} overlapping skills)
Hourly Rate: ${applicant.hourlyRate != null ? `$${Math.round(applicant.hourlyRate)}/hr` : 'Not listed'}
Experience: ${applicant.experienceYears != null ? `${applicant.experienceYears} years` : 'Not listed'}
Availability: ${applicant.availability || 'Not specified'}
Languages: ${applicant.languages.join(', ') || 'Not recorded'}
Primary Skills: ${applicant.primarySkills.slice(0, 12).join(', ') || 'Not provided'}
Shared Skills: ${Array.isArray(applicant.overlappingSkills) && applicant.overlappingSkills.length ? applicant.overlappingSkills.join(', ') : 'None explicitly matched'}
Resume Highlights: ${applicant.resumeHighlights.slice(0, 5).map((item) => `- ${sanitizeSnippet(item, 140)}`).join('\n') || 'None'}
Recent Projects: ${applicant.recentProjects.slice(0, 4).map((item) => `- ${sanitizeSnippet(item, 140)}`).join('\n') || 'None'}
Achievements: ${applicant.achievements.slice(0, 4).map((item) => `- ${sanitizeSnippet(item, 140)}`).join('\n') || 'None'}
Proposal Summary: ${sanitizeSnippet(applicant.proposalSummary, 320)}
Cover Letter Summary: ${sanitizeSnippet(applicant.coverLetterSummary, 320)}
Cover Letter Length: ${applicant.coverLetterLength != null ? `${applicant.coverLetterLength} characters` : 'Not available'}
`;
    }).join('\n\n');

    const prompt = `You are assisting a hiring manager in comparing multiple freelancer applicants for the same job. Analyse the structured data below.

Job Details:
${jobSnippet}

Applicants:
${applicantSummaries}

Instructions:
- Provide clear, data-backed insights with minimal narrative fluff.
- Highlight differentiators using the provided metrics (match score, skill overlap, hourly rate, experience, languages, highlights).
- Emphasise quantitative comparisons (e.g., highest match score, lowest rate, strongest domain alignment).
- Keep pros/cons to punchy single sentences (max 12 words each, <=3 bullets).
- Keep "summary" to a single sentence and "comparisonNotes" to short bullet statements (<=15 words).
- Avoid referencing applicants by index; use their names.

Return ONLY valid JSON with the following shape:
{
  "overallSummary": string,
  "comparisonNotes": string[] (3-5 bullet points),
  "applicants": [
    {
      "userId": string,
      "summary": string,
      "pros": string[] (<=3),
      "cons": string[] (<=3),
      "recommendedFocus": string,
      "suitability": "Excellent" | "Good" | "Moderate" | "Limited"
    }
  ]
}

Do not include commentary outside the JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Error generating applicant comparison with AI:', error);
    return null;
  }
}

const sanitizeEntryArray = (entries: any): { title: string; description: string }[] | undefined => {
  if (!Array.isArray(entries)) {
    return undefined;
  }

  const cleaned = entries
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
    .filter((value): value is { title: string; description: string } => Boolean(value));

  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Enhance a job description using Gemini AI
 */
export async function enhanceJobDescription(input: EnhanceJobDescriptionInput): Promise<string> {
  try {
    const { title, description, category, skills, budget, duration } = input;

    const prompt = `You are a professional job posting expert. Enhance the following job description to make it more compelling, clear, and professional.

Original Job Title: ${title}
Original Description: ${description}
${category ? `Category: ${category}` : ''}
${skills && skills.length > 0 ? `Required Skills: ${skills.join(', ')}` : ''}
${budget ? `Budget: $${budget}` : ''}
${duration ? `Duration: ${duration}` : ''}

Please enhance this job description by:
1. Making it more professional and compelling
2. Clearly outlining responsibilities and deliverables
3. Highlighting key requirements and qualifications
4. Adding structure with clear sections (Overview, Responsibilities, Requirements, etc.)
5. Using engaging and inclusive language
6. Keeping it concise but comprehensive (300-500 words)

Return ONLY the enhanced job description text, without any meta-commentary or labels. Format it in a clean, professional manner with proper paragraphs and bullet points where appropriate.`;

  // Resolve min/max words: prefer input, then environment, then defaults
  const DEFAULT_JOB_MIN = parseInt(process.env.JOB_ENHANCE_MIN_WORDS || process.env.MIN_WORDS || '50', 10);
  const DEFAULT_JOB_MAX = parseInt(process.env.JOB_ENHANCE_MAX_WORDS || process.env.MAX_WORDS || '2000', 10);
  const minWords = typeof input.minWords === 'number' ? input.minWords : DEFAULT_JOB_MIN;
  const maxWords = typeof input.maxWords === 'number' ? input.maxWords : DEFAULT_JOB_MAX;

    // First enhancement pass
    let result = await model.generateContent(prompt);
    let response = await result.response;
    let enhancedText = response.text().trim();

    // Helper to count words
    const countWords = (text: string) => (text || '').trim().split(/\s+/).filter(Boolean).length;

    let wordCount = countWords(enhancedText);

    // If the AI output is outside the allowed range, ask it to rewrite to fit the bounds.
    if (wordCount < minWords || wordCount > maxWords) {
      const adjustPrompt = `The enhanced proposal you produced has ${wordCount} words, which is outside the allowed range of ${minWords}-${maxWords} words. Please rewrite the enhanced proposal so that it remains faithful to the content, tone, and meaning of the previous enhanced version but has between ${minWords} and ${maxWords} words. Do not add unrelated filler or remove essential points. Return ONLY the rewritten enhanced proposal text.`;

      // Try up to 2 additional adjustment attempts
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await model.generateContent(`${enhancedText}\n\n${adjustPrompt}`);
          response = await result.response;
          enhancedText = response.text().trim();
          wordCount = countWords(enhancedText);
          if (wordCount >= minWords && wordCount <= maxWords) break;
        } catch (err) {
          console.warn('Adjustment attempt failed:', err);
        }
      }
    }

    // Final safety: if still out of bounds, perform a best-effort trim or pad (pad with brief summary sentences)
    wordCount = countWords(enhancedText);
    if (wordCount > maxWords) {
      // Truncate to maxWords (keep word boundaries)
      enhancedText = enhancedText.split(/\s+/).slice(0, maxWords).join(' ');
    } else if (wordCount < minWords) {
      // If too short after attempts, append a concise closing sentence to reach minWords
      const filler = ' I am confident I can deliver this project to your satisfaction and would welcome the opportunity to discuss further.';
      while (countWords(enhancedText) < minWords) {
        enhancedText = `${enhancedText}${filler}`;
        if (countWords(enhancedText) >= minWords) break;
      }
    }

    return enhancedText.trim();
  } catch (error) {
    console.error('Error enhancing job description:', error);
    throw new Error('Failed to enhance job description with AI');
  }
}

/**
 * Enhance a proposal using Gemini AI
 */
export async function enhanceProposal(input: EnhanceProposalInput): Promise<string> {
  try {
    const { jobTitle, jobDescription, originalProposal, freelancerSkills, freelancerExperience } = input;

    // Resolve min/max words for proposals: prefer input, then environment, then defaults
    const DEFAULT_PROPOSAL_MIN = parseInt(process.env.PROPOSAL_MIN_WORDS || process.env.MIN_WORDS || '50', 10);
    const DEFAULT_PROPOSAL_MAX = parseInt(process.env.PROPOSAL_MAX_WORDS || process.env.MAX_WORDS || '2000', 10);
    const minWords = typeof input.minWords === 'number' ? input.minWords : DEFAULT_PROPOSAL_MIN;
    const maxWords = typeof input.maxWords === 'number' ? input.maxWords : DEFAULT_PROPOSAL_MAX;

    const originalWordCount = originalProposal.trim().split(/\s+/).length;

    const prompt = `You are a professional proposal writer. Enhance the following freelancer proposal to make it more compelling, professional, and likely to win the job.

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Original Proposal: ${originalProposal}
${freelancerSkills && freelancerSkills.length > 0 ? `Freelancer Skills: ${freelancerSkills.join(', ')}` : ''}
${freelancerExperience ? `Experience: ${freelancerExperience}` : ''}

Please enhance this proposal by:
1. Creating a strong, personalized opening that shows understanding of the client's needs
2. Highlighting relevant skills and experience that match the job requirements
3. Providing a clear approach or methodology for completing the project
4. Demonstrating value and differentiating from other freelancers
5. Including a professional closing with a call to action
6. Using confident, professional language without being overly salesy

IMPORTANT: The enhanced proposal MUST have approximately the same number of words as the original proposal (original word count: ${originalWordCount}). Do not make it significantly longer or shorter. Do not add filler content just to match the word count.

Return ONLY the enhanced proposal text, without any meta-commentary or labels. Format it professionally with proper paragraphs.`;

    // First enhancement pass
    let result = await model.generateContent(prompt);
    let response = await result.response;
    let enhancedText = response.text().trim();

    // Helper to count words
    const countWords = (text: string) => (text || '').trim().split(/\s+/).filter(Boolean).length;

    let wordCount = countWords(enhancedText);

    // If the AI output is outside the allowed range, ask it to rewrite to fit the bounds.
    if (wordCount < minWords || wordCount > maxWords) {
      const adjustPrompt = `The enhanced proposal you produced has ${wordCount} words, which is outside the allowed range of ${minWords}-${maxWords} words. Please rewrite the enhanced proposal so that it remains faithful to the content, tone, and meaning of the previous enhanced version but has between ${minWords} and ${maxWords} words. Do not add unrelated filler or remove essential points. Return ONLY the rewritten enhanced proposal text.`;

      // Try up to 2 additional adjustment attempts
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await model.generateContent(`${enhancedText}\n\n${adjustPrompt}`);
          response = await result.response;
          enhancedText = response.text().trim();
          wordCount = countWords(enhancedText);
          if (wordCount >= minWords && wordCount <= maxWords) break;
        } catch (err) {
          console.warn('Adjustment attempt failed:', err);
        }
      }
    }

    // Final safety: if still out of bounds, perform a best-effort trim or pad
    wordCount = countWords(enhancedText);
    if (wordCount > maxWords) {
      enhancedText = enhancedText.split(/\s+/).slice(0, maxWords).join(' ');
    } else if (wordCount < minWords) {
      const filler = ' I am confident I can deliver this project to your satisfaction and would welcome the opportunity to discuss further.';
      while (countWords(enhancedText) < minWords) {
        enhancedText = `${enhancedText}${filler}`;
        if (countWords(enhancedText) >= minWords) break;
      }
    }

    return enhancedText.trim();
  } catch (error) {
    console.error('Error enhancing proposal:', error);
    throw new Error('Failed to enhance proposal with AI');
  }
}

/**
 * Generate job description suggestions based on title and category
 */
export async function generateJobSuggestions(title: string, category: string): Promise<{
  suggestedSkills: string[];
  suggestedDescription: string;
  estimatedBudget: string;
}> {
  try {
    const prompt = `Based on the job title "${title}" in the ${category} category, provide:
1. A list of 5-8 relevant skills required
2. A brief 2-3 sentence job description outline
3. An estimated budget range

Format your response as JSON with keys: suggestedSkills (array), suggestedDescription (string), estimatedBudget (string).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
    }

    // Fallback response
    return {
      suggestedSkills: [],
      suggestedDescription: text,
      estimatedBudget: 'Varies based on scope',
    };
  } catch (error) {
    console.error('Error generating job suggestions:', error);
    throw new Error('Failed to generate job suggestions with AI');
  }
}

/**
 * Analyze a proposal and provide improvement suggestions
 */
export async function analyzeProposal(proposal: string, jobDescription: string): Promise<{
  score: number;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
}> {
  try {
    const prompt = `Analyze the following freelancer proposal for the given job and provide constructive feedback.

Job Description: ${jobDescription}
Proposal: ${proposal}

Provide your analysis in the following JSON format:
{
  "score": <number from 0-100>,
  "strengths": [<array of 2-3 strengths>],
  "improvements": [<array of 2-3 improvement suggestions>],
  "overallFeedback": "<1-2 sentences of overall feedback>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
    }

    // Fallback response
    return {
      score: 70,
      strengths: ['Clear communication', 'Addresses job requirements'],
      improvements: ['Add more specific examples', 'Highlight unique value proposition'],
      overallFeedback: 'Good proposal with room for improvement.',
    };
  } catch (error) {
    console.error('Error analyzing proposal:', error);
    throw new Error('Failed to analyze proposal with AI');
  }
}

/**
 * Generate a cover letter based on job and freelancer profile
 */
export async function generateCoverLetter(
  jobTitle: string,
  jobDescription: string,
  freelancerName: string,
  freelancerSkills: string[],
  freelancerExperience: string
): Promise<string> {
  try {
    const prompt = `Write a professional cover letter for a freelancer applying to the following job:

Job Title: ${jobTitle}
Job Description: ${jobDescription}

Freelancer Name: ${freelancerName}
Skills: ${freelancerSkills.join(', ')}
Experience: ${freelancerExperience}

Create a compelling cover letter that:
1. Opens with a strong hook that shows interest in the specific project
2. Highlights relevant skills and experience
3. Explains why they're a great fit for this job
4. Includes a brief example or approach to the project
5. Closes with confidence and a call to action
6. Is 200-300 words

Return only the cover letter text without any labels or meta-commentary.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const coverLetter = response.text();

    return coverLetter.trim();
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw new Error('Failed to generate cover letter with AI');
  }
}

export default {
  enhanceJobDescription,
  enhanceProposal,
  generateJobSuggestions,
  analyzeProposal,
  generateCoverLetter,
  suggestProfileFields,
  generateJobMatchAnalysis,
  generateApplicantComparison,
};

/**
 * Suggest forum post content (title, content, tags) using AI
 */
export async function suggestForumPost(title: string, category: string, context = ''): Promise<{ suggestedTitle: string; suggestedContent: string; suggestedTags: string[] }> {
  try {
    const prompt = `You are a helpful assistant that helps users write community forum posts.
Given the requested post title or idea: "${title}", the category: "${category}", and any additional context: "${context}", produce a suggested post title, a 2-4 paragraph body suitable for a community forum (clear, friendly, and actionable), and a list of 3-6 relevant tags.

Return your response as JSON with keys: suggestedTitle (string), suggestedContent (string), suggestedTags (array of strings).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestedTitle: parsed.suggestedTitle || title,
          suggestedContent: parsed.suggestedContent || parsed.content || '',
          suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : (parsed.tags || []).slice(0, 6),
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestion response as JSON:', parseError);
    }

    // Fallback: return plain text as suggestedContent
    return {
      suggestedTitle: title,
      suggestedContent: text.trim(),
      suggestedTags: [],
    };
  } catch (error) {
    console.error('Error generating forum post suggestion:', error);
    throw new Error('Failed to generate forum post suggestion with AI');
  }
}

export async function suggestProfileFields(input: ProfileSuggestionInput): Promise<ProfileSuggestionOutput | null> {
  try {
    const { resumeText, parsedResume, existingProfile } = input;

    const prompt = `You are assisting with auto-filling a freelancer profile based on their resume. Any field you return will immediately overwrite the profile field, so return values ONLY when the resume provides clear evidence.

Return ONLY a JSON object (no Markdown, backticks, or commentary). The JSON may include any of these keys when you can confidently fill them:
{
  "title": string,
  "company": string,
  "bio": string,
  "availability": "Available" | "Busy" | "Not Available",
  "website": string,
  "linkedin": string,
  "github": string,
  "skills": string[],
  "languages": string[],
  "experience": [{"title": string, "description": string}],
  "projects": [{"title": string, "description": string}],
  "achievements": [{"title": string, "description": string}]
}

Formatting rules:
- Output MUST be valid JSON. Do not include comments or trailing commas.
- Omit any key you are unsure about or that already has a value in the existing profile data.
- "skills" must be an array of unique skill phrases (2-4 words max) sourced from the resume. Do not place achievements or certifications here.
- "languages" must be an array of spoken/written languages only.
- "experience" entries represent roles or employment engagements. Create a new object whenever the resume shows a new job, company, or role (bullet points, numbered lists, or headings indicate new entries).
- "projects" entries represent discrete project work. Create a new object for each project explicitly mentioned. Never merge multiple projects into one entry.
- "achievements" are awards, certifications, quantitative accomplishments, or honors. Keep them separate from skills/projects/experience.
- Each object in experience/projects/achievements must have a concise "title" (<= 12 words) and a "description" summarising the key details (1-2 sentences).
- Use bullet/number indicators (•, -, *, 1., (1), etc.) or section headings in the resume to determine separate entries.
- Prefer the most recent LinkedIn/GitHub/website URLs when multiple exist.

Existing profile (fields with values should NOT be overwritten):
${JSON.stringify(existingProfile)}

Resume structured data:
${JSON.stringify({ skills: parsedResume.skills, experience: parsedResume.experience, projects: parsedResume.projects, achievements: parsedResume.achievements, websites: parsedResume.websites, linkedinUrls: parsedResume.linkedinUrls, githubUrls: parsedResume.githubUrls }).slice(0, 6000)}

Resume text (truncated):
${resumeText.slice(0, 8000)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const output: ProfileSuggestionOutput = {};

    const maybeString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
    const sanitizeStringArray = (value: unknown, limit = 32): string[] => {
      if (!Array.isArray(value)) {
        return [];
      }

      const result: string[] = [];
      const seen = new Set<string>();

      for (const item of value) {
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

    const title = maybeString(parsed.title);
    if (title) output.title = title;

    const company = maybeString(parsed.company);
    if (company) output.company = company;

    const bio = maybeString(parsed.bio);
    if (bio) output.bio = bio;

    const availability = maybeString(parsed.availability);
    if (availability) output.availability = availability;

    const website = maybeString(parsed.website);
    if (website) output.website = website;

    const linkedin = maybeString(parsed.linkedin);
    if (linkedin) output.linkedin = linkedin;

    const github = maybeString(parsed.github);
    if (github) output.github = github;

    const skills = sanitizeStringArray(parsed.skills);
    if (skills.length) {
      output.skills = skills;
    }

    const languages = sanitizeStringArray(parsed.languages);
    if (languages.length) {
      output.languages = languages;
    }

    const experience = sanitizeEntryArray(parsed.experience);
    if (experience) {
      output.experience = experience;
    }

    const projects = sanitizeEntryArray(parsed.projects);
    if (projects) {
      output.projects = projects;
    }

    const achievements = sanitizeEntryArray(parsed.achievements);
    if (achievements) {
      output.achievements = achievements;
    }

    return Object.keys(output).length > 0 ? output : null;
  } catch (error) {
    console.error('Error suggesting profile fields with AI:', error);
    return null;
  }
}
