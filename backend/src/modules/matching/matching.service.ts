import { Injectable } from '@nestjs/common';
import {
  Opportunity,
  EmploymentOpportunityDetail,
  ScholarshipOpportunityDetail,
  WorkArrangement,
  FundingLevel,
} from '@prisma/client';

export type MatchLabel =
  | 'STRONG_MATCH'
  | 'GOOD_MATCH'
  | 'POTENTIAL_MATCH'
  | 'RELEVANT'
  | 'EXCLUDED';

export const SECTOR_CANONICAL_MAP: Record<string, string> = {
  // Finance
  finance: 'finance',
  banking: 'finance',
  insurance: 'finance',
  'finance & banking': 'finance',
  'banking, finance & insurance': 'finance',
  'banking & finance': 'finance',
  'financial services': 'finance',
  fintech: 'finance',

  // Technology
  technology: 'technology',
  software: 'technology',
  it: 'technology',
  'it & digital': 'technology',
  'technology & software': 'technology',
  'information technology': 'technology',
  'information technology & digital services': 'technology',
  'digital services': 'technology',
  'software engineering': 'technology',

  // Development & Non-Profit
  development: 'development',
  'non-profit': 'development',
  nonprofit: 'development',
  'development & non-profit': 'development',
  'nonprofit & development': 'development',
  'nonprofit, humanitarian & international development': 'development',
  humanitarian: 'development',
  'international development': 'development',
  ngo: 'development',

  // Consulting & Strategy
  consulting: 'consulting',
  strategy: 'consulting',
  'consulting & strategy': 'consulting',
  'management consulting': 'consulting',
  'professional, scientific & technical services': 'consulting',
  'professional services': 'consulting',

  // Agriculture
  agriculture: 'agriculture',
  agribusiness: 'agriculture',
  'agriculture & agribusiness': 'agriculture',
  farming: 'agriculture',
  agritech: 'agriculture',

  // Healthcare
  health: 'health',
  healthcare: 'health',
  'health & social care': 'health',
  'healthcare & life sciences': 'health',
  medicine: 'health',
  'social care': 'health',

  // Education
  education: 'education',
  training: 'education',
  'education & training': 'education',
  edtech: 'education',

  // Energy
  energy: 'energy',
  utilities: 'energy',
  'energy & utilities': 'energy',
  'renewable energy': 'energy',
  power: 'energy',

  // Government
  government: 'government',
  'public administration': 'government',
  'government & public administration': 'government',
  'public sector': 'government',
  'civil service': 'government',

  // Manufacturing
  manufacturing: 'manufacturing',
  'industrial production': 'manufacturing',
  'manufacturing & industrial production': 'manufacturing',

  // Media
  media: 'media',
  publishing: 'media',
  communications: 'media',
  'media, publishing & communications': 'media',

  // Retail
  retail: 'retail',
  wholesale: 'retail',
  'e-commerce': 'retail',
  'retail, wholesale & e-commerce': 'retail',
  'consumer goods & retail': 'retail',
  fmcg: 'retail',

  // Transport & Logistics
  transport: 'transport',
  logistics: 'transport',
  'transport & logistics': 'transport',
  'supply chain': 'transport',

  // Real Estate
  'real estate': 'real_estate',
  property: 'real_estate',
  'real estate & property services': 'real_estate',

  // Telecommunications
  telecommunications: 'telecom',
  telecom: 'telecom',
  telecoms: 'telecom',

  // Construction
  construction: 'construction',
  infrastructure: 'construction',
  'construction & infrastructure': 'construction',

  // Environment
  environment: 'environment',
  water: 'environment',
  waste: 'environment',
  'environment, water & waste management': 'environment',
  sustainability: 'environment',

  // Hospitality
  hospitality: 'hospitality',
  tourism: 'hospitality',
  'hospitality & tourism': 'hospitality',

  // Mining
  mining: 'mining',
  'oil & gas': 'mining',
  'mining, oil & gas': 'mining',

  // Arts & Sports
  arts: 'arts',
  culture: 'arts',
  sports: 'arts',
  entertainment: 'arts',
  'arts, culture, sports & entertainment': 'arts',

  // Business Support
  'administrative & business support services': 'business_support',
  'business support': 'business_support',
  administration: 'business_support',

  // Other
  'other services': 'other',
};

export function areSectorsMatching(s1?: string, s2?: string): boolean {
  if (!s1 || !s2) return false;
  const clean1 = s1.trim().toLowerCase();
  const clean2 = s2.trim().toLowerCase();
  if (clean1 === clean2) return true;

  const canon1 = SECTOR_CANONICAL_MAP[clean1];
  const canon2 = SECTOR_CANONICAL_MAP[clean2];
  if (canon1 && canon2 && canon1 === canon2) return true;

  const words1 = clean1.split(/[\s,&/]+/).filter((w) => w.length > 3);
  const words2 = clean2.split(/[\s,&/]+/).filter((w) => w.length > 3);
  return words1.some((w) => words2.includes(w));
}

export function areFunctionsMatching(f1?: string, f2?: string): boolean {
  if (!f1 || !f2) return false;
  const clean1 = f1.trim().toLowerCase();
  const clean2 = f2.trim().toLowerCase();
  if (clean1 === clean2) return true;
  const words1 = clean1.split(/[\s,&/]+/).filter((w) => w.length > 3);
  const words2 = clean2.split(/[\s,&/]+/).filter((w) => w.length > 3);
  return words1.some((w) => words2.includes(w));
}

export interface MatchEvaluationResult {
  opportunityId: string;
  isEligible: boolean;
  fitScore: number; // 0 - 100
  matchLabel: MatchLabel;
  displayLabel: string;
  displayColor: 'emerald' | 'blue' | 'amber' | 'slate';
  matchedReasons: string[];
  warnings: string[];
}

export interface FullCandidateProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  commonProfile?: {
    locationCountry?: string;
    nationalities?: any;
    fieldOfStudy?: string;
    highestQualification?: string;
    academicClassification?: string;
  } | null;
  employmentProfile?: {
    workAuthorisation?: any;
    sectorsOfInterest?: any;
    functionsOfInterest?: any;
    skills?: any;
    workArrangement?: WorkArrangement;
    experienceLevel?: string;
    yearsOfExperience?: number;
  } | null;
  scholarshipProfile?: {
    desiredStudyLevels?: any;
    desiredFields?: any;
    preferredStudyCountries?: any;
    fundingRequirement?: any;
    academicClassification?: string;
  } | null;
}

@Injectable()
export class MatchingService {
  /**
   * Transparent Rules-Based Matching Engine
   * Strictly implements Workbook Sheets 10, 16, 17, 18, 19
   * Evaluates Hard Eligibility Gates + Weighted Fit Preferences
   */
  evaluateOpportunityMatch(
    opp: Opportunity & {
      employmentDetail?: EmploymentOpportunityDetail | null;
      scholarshipDetail?: ScholarshipOpportunityDetail | null;
    },
    profile?: FullCandidateProfile | null,
  ): MatchEvaluationResult {
    // If no profile is available (e.g. unauthenticated public user), return neutral RELEVANT match
    if (!profile) {
      return {
        opportunityId: opp.id,
        isEligible: true,
        fitScore: 50,
        matchLabel: 'RELEVANT',
        displayLabel: 'Relevant to Your Profile',
        displayColor: 'blue',
        matchedReasons: ['Public opportunity listing open for exploration.'],
        warnings: [],
      };
    }

    const matchedReasons: string[] = [];
    const warnings: string[] = [];
    let gatePassed = true;
    let isGateUnknown = false;
    let earnedPoints = 0;

    const common = profile.commonProfile || {};
    const nats = Array.isArray(common.nationalities)
      ? common.nationalities
      : ['Nigerian'];
    const userNationality = nats[0] || 'Nigerian';
    const userCountry = common.locationCountry || 'Nigeria';
    const userField = common.fieldOfStudy || 'Economics & Development Studies';
    const userAcademicClass =
      common.academicClassification ||
      profile.scholarshipProfile?.academicClassification ||
      '';

    // =========================================================================
    // 1. SCHOLARSHIP EVALUATION
    // =========================================================================
    if (opp.opportunityType === 'SCHOLARSHIP' && opp.scholarshipDetail) {
      const details = opp.scholarshipDetail;
      const eligibleNats: string[] = Array.isArray(details.eligibleNationalities)
        ? (details.eligibleNationalities as string[])
        : ['All'];

      // Gate 1A: Nationality Gate
      const isNatUniversal =
        eligibleNats.includes('All') ||
        eligibleNats.includes('Multiple') ||
        eligibleNats.includes('All African Nations') ||
        eligibleNats.includes('All Developing Nations');

      const isNatMatched =
        isNatUniversal ||
        eligibleNats.some(
          (n) =>
            n.toLowerCase().includes(userNationality.toLowerCase()) ||
            userNationality.toLowerCase().includes(n.toLowerCase()),
        );

      if (!isNatMatched) {
        gatePassed = false;
        warnings.push(
          `Nationality requirement: Open strictly to citizens of ${eligibleNats.join(', ')}.`,
        );
      } else {
        matchedReasons.push(`Your nationality (${userNationality}) is eligible.`);
        earnedPoints += 25;
      }

      // Gate 1B: Field of Study Restriction
      const eligibleFields: string[] = Array.isArray(details.eligibleFields)
        ? (details.eligibleFields as string[])
        : ['All Fields'];

      const isFieldUniversal =
        eligibleFields.includes('All Fields') ||
        eligibleFields.includes('Multiple') ||
        eligibleFields.length === 0;

      const isFieldMatched =
        isFieldUniversal ||
        eligibleFields.some(
          (f) =>
            f.toLowerCase().includes(userField.toLowerCase()) ||
            userField.toLowerCase().includes(f.toLowerCase()),
        );

      if (!isFieldMatched) {
        gatePassed = false;
        warnings.push(
          `Field restriction: This scholarship is strictly open to ${eligibleFields.join(', ')}.`,
        );
      } else {
        matchedReasons.push(`Academic discipline (${userField}) is eligible.`);
        earnedPoints += 20;
      }

      // Gate 1C: Target Study Level Match
      const desiredLevels: string[] = Array.isArray(
        profile.scholarshipProfile?.desiredStudyLevels,
      )
        ? (profile.scholarshipProfile?.desiredStudyLevels as string[])
        : ["Master's Degree"];

      const oppLevels: string[] = Array.isArray(details.studyLevels)
        ? (details.studyLevels as string[])
        : ["Master's Degree"];

      const levelMatch = oppLevels.some((lvl) => desiredLevels.includes(lvl));
      if (levelMatch) {
        matchedReasons.push(`Intended study level matches (${oppLevels.join('/')}).`);
        earnedPoints += 20;
      }

      // Gate 1D: Missing Academic Classification Check
      if (!userAcademicClass) {
        isGateUnknown = true;
        warnings.push(
          'Please confirm your academic result / transcript classification in your profile.',
        );
      } else {
        earnedPoints += 15;
      }

      // Preferences: Preferred Countries
      const prefCountries: string[] = Array.isArray(
        profile.scholarshipProfile?.preferredStudyCountries,
      )
        ? (profile.scholarshipProfile?.preferredStudyCountries as string[])
        : [];

      if (prefCountries.includes(opp.country)) {
        matchedReasons.push(`Matches your preferred destination country (${opp.country}).`);
        earnedPoints += 10;
      }

      // Preferences: Funding Requirement
      if (
        details.fundingLevel === FundingLevel.FULLY_FUNDED &&
        profile.scholarshipProfile?.fundingRequirement !== 'PARTIAL'
      ) {
        matchedReasons.push('Meets your fully funded requirement (100% tuition + stipend).');
        earnedPoints += 10;
      }

      // Language requirement warning notice if specified
      if (details.languageRequirement) {
        warnings.push(
          `Action needed: Requires official English proficiency (${details.languageRequirement}) prior to deadline.`,
        );
      }
    }

    // =========================================================================
    // 2. EMPLOYMENT EVALUATION
    // =========================================================================
    if (opp.opportunityType === 'EMPLOYMENT' && opp.employmentDetail) {
      const details = opp.employmentDetail;
      const emp = profile.employmentProfile || {};

      // Gate 2A: Work Authorisation
      const authData = emp.workAuthorisation;
      const isAuthForCountry = (c: string): boolean => {
        if (Array.isArray(authData)) {
          return authData.includes(c);
        }
        if (authData && typeof authData === 'object') {
          return authData[c] === 'Yes';
        }
        return c.toLowerCase() === userCountry.toLowerCase();
      };

      const eligibleNats: string[] = Array.isArray(details.eligibleNationalities)
        ? (details.eligibleNationalities as string[])
        : ['All'];

      const isAuthUniversal =
        eligibleNats.includes('All') || details.workArrangement === WorkArrangement.REMOTE;

      const hasWorkAuth =
        isAuthUniversal || eligibleNats.some((c) => isAuthForCountry(c));

      if (!hasWorkAuth) {
        gatePassed = false;
        warnings.push(
          `Work authorization requirement: Employer requires legal right to work in ${opp.country}.`,
        );
      } else {
        matchedReasons.push('Work authorization criteria aligned.');
        earnedPoints += 25;
      }

      // Fit 2B: Sector Match
      const userSectors: string[] = Array.isArray(emp.sectorsOfInterest)
        ? (emp.sectorsOfInterest as string[])
        : [];

      const isAnySector =
        userSectors.length === 0 ||
        userSectors.includes('Any') ||
        userSectors.includes('Open to any sector');

      let sectorMatched = false;
      if (isAnySector) {
        sectorMatched = true;
        matchedReasons.push('Open to any sector (no industry filtering restriction).');
        earnedPoints += 20;
      } else {
        sectorMatched = userSectors.some((sec) => areSectorsMatching(sec, details.sector));
        if (sectorMatched) {
          matchedReasons.push(`Matches your target sector: ${details.sector}.`);
          earnedPoints += 20;
        } else {
          warnings.push(
            `Industry notice: Opportunity is in ${details.sector} (outside your selected sector preference).`,
          );
        }
      }

      // Fit 2C: Function & Career Level
      const userFunctions: string[] = Array.isArray(emp.functionsOfInterest)
        ? (emp.functionsOfInterest as string[])
        : [];

      const isAnyFunction = userFunctions.length === 0;
      if (isAnyFunction || userFunctions.some((f) => areFunctionsMatching(f, details.function))) {
        matchedReasons.push(`Aligns with your functional focus: ${details.function}.`);
        earnedPoints += 15;
      }

      // Fit 2D: Skills Overlap
      const userSkills: string[] = Array.isArray(emp.skills)
        ? (emp.skills as string[])
        : [];
      const oppSkills: string[] = Array.isArray(details.requiredSkills)
        ? (details.requiredSkills as string[])
        : [];

      const matchedSkills = oppSkills.filter((req) =>
        userSkills.some((s) => s.toLowerCase() === req.toLowerCase()),
      );

      if (matchedSkills.length > 0) {
        matchedReasons.push(`Matches key skills: ${matchedSkills.slice(0, 3).join(', ')}.`);
        earnedPoints += Math.min(25, matchedSkills.length * 8);
      }

      // Fit 2E: Work Arrangement
      if (
        !emp.workArrangement ||
        emp.workArrangement === WorkArrangement.ANY ||
        emp.workArrangement === details.workArrangement
      ) {
        matchedReasons.push(
          `Work format matches preference (${details.workArrangement.toLowerCase()}).`,
        );
        earnedPoints += 15;
      }

      // Strict Sector Targeting Rule:
      // If user explicitly chose specific sectors and this opportunity is NOT in those sectors,
      // cap the maximum score at 58% so it is never presented as "Good Profile Match" or "Strong Profile Match".
      if (!isAnySector && !sectorMatched) {
        earnedPoints = Math.min(58, earnedPoints);
      }
    }

    // =========================================================================
    // 3. FINAL SCORE & TIER LABELS
    // =========================================================================
    const finalScore = Math.min(100, Math.max(0, earnedPoints));

    let label: MatchLabel = 'RELEVANT';
    let displayLabel = 'Relevant to Your Profile';
    let displayColor: 'emerald' | 'blue' | 'amber' | 'slate' = 'blue';

    if (!gatePassed) {
      label = 'EXCLUDED';
      displayLabel = 'Criteria Not Met';
      displayColor = 'slate';
    } else if (isGateUnknown) {
      label = 'POTENTIAL_MATCH';
      displayLabel = 'Potential Match — Check Eligibility';
      displayColor = 'amber';
    } else if (finalScore >= 80) {
      label = 'STRONG_MATCH';
      displayLabel = 'Strong Profile Match';
      displayColor = 'emerald';
    } else if (finalScore >= 65) {
      label = 'GOOD_MATCH';
      displayLabel = 'Good Profile Match';
      displayColor = 'emerald';
    } else {
      label = 'RELEVANT';
      displayLabel = 'Relevant to Your Profile';
      displayColor = 'blue';
    }

    return {
      opportunityId: opp.id,
      isEligible: gatePassed,
      fitScore: finalScore,
      matchLabel: label,
      displayLabel,
      displayColor,
      matchedReasons: matchedReasons.slice(0, 3),
      warnings,
    };
  }
}
