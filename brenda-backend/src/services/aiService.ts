import { GoogleGenerativeAI } from '@google/generative-ai';

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
