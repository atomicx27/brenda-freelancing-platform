import pdfParse from 'pdf-parse';

export interface ResumeExperienceEntry {
  title: string;
  description: string;
}

export interface ResumeProjectEntry {
  title: string;
  description: string;
}

export interface ResumeAchievementEntry {
  title: string;
  description: string;
}

export interface ParsedResume {
  text: string;
  skills: string[];
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  achievements: ResumeAchievementEntry[];
  websites: string[];
  linkedinUrls: string[];
  githubUrls: string[];
}

const SECTION_MAP: Record<string, 'skills' | 'experience' | 'projects' | 'achievements'> = {
  'skills': 'skills',
  'technical skills': 'skills',
  'core competencies': 'skills',
  'skills & expertise': 'skills',
  'work experience': 'experience',
  'professional experience': 'experience',
  'experience': 'experience',
  'employment history': 'experience',
  'projects': 'projects',
  'project experience': 'projects',
  'selected projects': 'projects',
  'achievements': 'achievements',
  'achievement': 'achievements',
  'accomplishments': 'achievements',
  'awards': 'achievements',
  'recognition': 'achievements'
};

const normalizeLine = (line: string) => line.replace(/\s+/g, ' ').trim();

const splitIntoSections = (lines: string[]) => {
  const buckets: Record<'skills' | 'experience' | 'projects' | 'achievements' | 'general', string[]> = {
    skills: [],
    experience: [],
    projects: [],
    achievements: [],
    general: []
  };

  let current: 'skills' | 'experience' | 'projects' | 'achievements' | 'general' = 'general';

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    if (!line) {
      continue;
    }

    const lower = line.toLowerCase();
    const matchedKey = Object.keys(SECTION_MAP).find((key) => {
      return lower === key || lower.startsWith(`${key}:`);
    });

    if (matchedKey) {
      current = SECTION_MAP[matchedKey];
      continue;
    }

    buckets[current].push(line);
  }

  return buckets;
};

const splitEntries = (lines: string[]): string[][] => {
  const entries: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      entries.push(current);
      current = [];
    }
  };

  const bulletRegex = /^(?:\d{1,3}[\.)]\s+|[•\-*\u2022\u25AA\u25CF\u2219]\s+)/;

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);

    if (!line) {
      flush();
      continue;
    }

    if (bulletRegex.test(rawLine)) {
      const cleaned = normalizeLine(rawLine.replace(bulletRegex, ''));
      if (cleaned) {
        flush();
        current.push(cleaned);
        continue;
      }
    }

    if (current.length === 0 && entries.length > 0) {
      const previous = entries[entries.length - 1];
      const isContinuation = previous.length > 0 && previous[previous.length - 1].endsWith(':');
      if (isContinuation) {
        previous.push(line);
        continue;
      }
    }

    current.push(line);
  }

  flush();
  return entries;
};

const extractSkills = (lines: string[]) => {
  if (lines.length === 0) {
    return [] as string[];
  }

  const combined = lines.join(' ');
  return Array.from(new Set(
    combined
      .split(/[,;•\-\|\n]/)
      .map((item) => normalizeLine(item))
      .filter((item) => item.length > 1 && item.length <= 64)
  ));
};

const mapEntries = (entries: string[][]): { title: string; description: string }[] => {
  return entries
    .map((group) => normalizeLine(group.join(' ')))
    .filter((summary) => summary.length > 0)
    .slice(0, 12)
    .map((summary) => {
      const parts = summary.split(/\s[-–—]\s/);
      if (parts.length > 1) {
        const [title, ...rest] = parts;
        return {
          title: title.trim(),
          description: rest.join(' - ').trim()
        };
      }

      const sentences = summary.split(/\.\s+/);
      const title = sentences.shift() || summary;
      const description = sentences.join('. ').trim();

      return {
        title: title.trim(),
        description: description.length > 0 ? description : summary
      };
    });
};

const extractUrls = (text: string): string[] => {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) || [];
  return Array.from(new Set(matches.map((url) => url.replace(/[.,]+$/, ''))));
};

const pdfParseFn = pdfParse as (data: Buffer) => Promise<{ text: string }>;

export const parseResume = async (fileBuffer: Buffer): Promise<ParsedResume> => {
  const pdfData = await pdfParseFn(fileBuffer);
  const text = pdfData.text || '';
  const lines = text.split('\n');
  const sections = splitIntoSections(lines);

  const skills = extractSkills(sections.skills);
  const experienceEntries = mapEntries(splitEntries(sections.experience)) as ResumeExperienceEntry[];
  const projectEntries = mapEntries(splitEntries(sections.projects)) as ResumeProjectEntry[];
  const achievementEntries = mapEntries(splitEntries(sections.achievements)) as ResumeAchievementEntry[];

  const urls = extractUrls(text);
  const linkedinUrls = urls.filter((url) => url.toLowerCase().includes('linkedin.com'));
  const githubUrls = urls.filter((url) => url.toLowerCase().includes('github.com'));
  const websites = urls.filter((url) => !linkedinUrls.includes(url) && !githubUrls.includes(url));

  return {
    text,
    skills,
    experience: experienceEntries,
    projects: projectEntries,
    achievements: achievementEntries,
    websites,
    linkedinUrls,
    githubUrls
  };
};


