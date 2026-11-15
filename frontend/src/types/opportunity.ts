import type { WorkArrangement, FundingRequirement } from './profile';

export type OpportunityType = 'SCHOLARSHIP' | 'EMPLOYMENT';

export type MatchLabel =
  | 'STRONG_MATCH'
  | 'GOOD_MATCH'
  | 'RELEVANT'
  | 'POTENTIAL_MATCH'
  | 'EXCLUDED';

export interface Opportunity {
  id: string;
  referenceCode: string; // e.g. "SCH-0001", "EMP-0001"
  opportunityType: OpportunityType;
  title: string;
  organization: string;
  country: string;
  location: string; // e.g. "Nairobi", "London", "Remote (Global)"
  deadline: string; // ISO date string e.g. "2026-12-15"
  openingDate?: string;
  applicationUrl: string; // Official external URL
  sourceUrl?: string;
  lastVerifiedAt: string;
  isFeatured?: boolean;
  isNewThisWeek?: boolean;
  overview: string;
  requirements: string[];

  // Scholarship specific
  scholarshipDetails?: {
    studyLevels: string[]; // e.g. ["Master's Degree", "PhD"]
    eligibleNationalities: string[]; // ["All"] or specific countries
    eligibleFields: string[]; // ["All Fields"] or specific e.g. ["Public Policy", "Economics"]
    academicRequirement: string; // e.g. "First Class or 2:1 equivalent"
    fundingLevel: 'FULLY_FUNDED' | 'PARTIAL' | 'VARIABLE';
    languageRequirement?: string; // e.g. "IELTS 6.5 or equivalent"
    programStartYear?: number;
  };

  // Employment specific
  employmentDetails?: {
    subType: 'Full-time' | 'Graduate programme' | 'Internship' | 'Fellowship';
    sector: string; // e.g. "Technology & Software", "Finance & Banking"
    function: string; // e.g. "Data & Analytics", "Operations"
    workArrangement: WorkArrangement;
    experienceLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Executive';
    minimumEducation: string;
    eligibleNationalities: string[]; // ["All"] or specific
    requiredSkills: string[];
    compensationRange?: string; // e.g. "£32,000 - £38,000 / year"
  };
}

export interface MatchEvaluation {
  opportunityId: string;
  label: MatchLabel;
  score: number; // 0 - 100%
  displayLabel: string;
  displayColor: 'emerald' | 'blue' | 'amber' | 'slate';
  gatePassed: boolean;
  matchedReasons: string[]; // Top 3 reasons
  warnings: string[]; // Action needed / warning items
  isSaved?: boolean;
}
