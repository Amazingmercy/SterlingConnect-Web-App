import type { Opportunity, MatchEvaluation, MatchLabel } from '../../types/opportunity';
import type { FullProfile } from '../../types/profile';

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

  // Keyword overlap for multi-word sectors
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

/**
 * Rules-based matching engine strictly implementing the 5-step specification from
 * SterlingConnect Product Logic Workbook (Sheets 10, 16, 17, 18, 19).
 */
export function evaluateOpportunityMatch(
  opp: Opportunity,
  profile: FullProfile,
  userPathway?: string
): MatchEvaluation {
  const matchedReasons: string[] = [];
  const warnings: string[] = [];
  let gatePassed = true;
  let isGateUnknown = false;
  let earnedPoints = 0;
  let totalAvailablePoints = 100;

  const userNationality = profile.common.nationalities[0] || 'Nigerian';
  const userCountry = profile.common.countryOfResidence || 'Nigeria';
  const userField = profile.common.fieldOfStudy || 'Economics & Development Studies';
  const userQualification = profile.common.highestQualification || "Bachelor's Degree";
  const userAcademicClass = profile.common.academicClassification || '';

  // -------------------------------------------------------------
  // STEP 1: HARD ELIGIBILITY GATES
  // -------------------------------------------------------------

  // Gate 1A: Scholarship Nationality Gate (T01, T02)
  if (opp.opportunityType === 'SCHOLARSHIP' && opp.scholarshipDetails) {
    const eligibleNats = opp.scholarshipDetails.eligibleNationalities;
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
          userNationality.toLowerCase().includes(n.toLowerCase())
      );

    if (!isNatMatched) {
      gatePassed = false;
      warnings.push(`Nationality requirement: Limited to citizens of ${eligibleNats.join(', ')}.`);
    } else {
      matchedReasons.push(`Your nationality (${userNationality}) is eligible.`);
      earnedPoints += 25;
    }

    // Gate 1B: Explicit Field Restrictions (T10 - e.g. STEM-only)
    const eligibleFields = opp.scholarshipDetails.eligibleFields;
    const isFieldUniversal = eligibleFields.includes('All Fields') || eligibleFields.includes('Multiple');
    const isFieldMatched =
      isFieldUniversal ||
      eligibleFields.some((f) => f.toLowerCase().includes(userField.toLowerCase()) || userField.toLowerCase().includes(f.toLowerCase()));

    if (!isFieldMatched) {
      gatePassed = false;
      warnings.push(`Field restriction: This award is strictly open to ${eligibleFields.join(', ')}.`);
    } else {
      matchedReasons.push(`Academic discipline (${userField}) is eligible.`);
      earnedPoints += 20;
    }

    // Gate 1C: Target Study Level Match (MR002)
    const desiredLevels = profile.scholarship.desiredStudyLevels || ["Master's Degree"];
    const levelMatch = opp.scholarshipDetails.studyLevels.some((lvl) =>
      desiredLevels.includes(lvl)
    );
    if (levelMatch) {
      matchedReasons.push(`Intended study level matches (${opp.scholarshipDetails.studyLevels.join('/')}).`);
      earnedPoints += 20;
    }

    // Gate 1D: Missing Academic Classification Check (T03)
    if (!userAcademicClass) {
      isGateUnknown = true;
      warnings.push('Please confirm your academic result / transcript classification in your profile.');
    } else {
      earnedPoints += 15;
    }

    // Preferences: Preferred Countries (MR003 / T04)
    const prefCountries = profile.scholarship.preferredStudyCountries || [];
    if (prefCountries.includes(opp.country)) {
      matchedReasons.push(`Matches your preferred destination country (${opp.country}).`);
      earnedPoints += 10;
    }

    // Preferences: Funding Requirement
    if (
      opp.scholarshipDetails.fundingLevel === 'FULLY_FUNDED' &&
      profile.scholarship.fundingRequirement === 'FULLY_FUNDED'
    ) {
      matchedReasons.push('Meets your fully funded requirement (100% tuition + stipend).');
      earnedPoints += 10;
    }

    // Action needed notice: Language test (T09)
    if (opp.scholarshipDetails.languageRequirement) {
      warnings.push(
        `Action needed: Requires official English proficiency (${opp.scholarshipDetails.languageRequirement}) prior to closing.`
      );
    }
  }

  // -------------------------------------------------------------
  // STEP 2: EMPLOYMENT HARD GATES & PREFERENCES (T05, T06, T07)
  // -------------------------------------------------------------
  if (opp.opportunityType === 'EMPLOYMENT' && opp.employmentDetails) {
    const details = opp.employmentDetails;

    // Gate 2A: Work Authorisation (T06)
    const authData = profile.employment.workAuthorisation;
    const isAuthForCountry = (c: string): boolean => {
      if (Array.isArray(authData)) {
        return authData.includes(c);
      }
      if (authData && typeof authData === 'object') {
        return (authData as Record<string, string>)[c] === 'Yes';
      }
      return c === userCountry;
    };

    const isAuthUniversal = details.eligibleNationalities.includes('All') || details.workArrangement === 'REMOTE';
    const hasWorkAuth =
      isAuthUniversal ||
      details.eligibleNationalities.some((c) => isAuthForCountry(c));

    if (!hasWorkAuth) {
      gatePassed = false;
      warnings.push(`Work authorization requirement: Employer requires legal right to work in ${opp.country}.`);
    } else {
      matchedReasons.push('Work authorization criteria aligned.');
      earnedPoints += 25;
    }

    // Fit 2B: Sector Match (MR004)
    const userSectors = profile.employment.sectorsOfInterest || [];
    const sectorMode = profile.employment.sector_preference_mode;
    const isAnySector =
      sectorMode === 'any' ||
      userSectors.length === 0 ||
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
        warnings.push(`Industry notice: Opportunity is in ${details.sector} (outside your selected sector preference).`);
      }
    }

    // Fit 2C: Function & Career Level (T05)
    const userFunctions = profile.employment.functionsOfInterest || [];
    const isAnyFunction = userFunctions.length === 0;
    if (isAnyFunction || userFunctions.some((f) => areFunctionsMatching(f, details.function))) {
      matchedReasons.push(`Aligns with your functional focus: ${details.function}.`);
      earnedPoints += 15;
    }

    // Fit 2D: Skills Overlap
    const userSkills = profile.employment.skills || [];
    const matchedSkills = details.requiredSkills.filter((req) =>
      userSkills.some((s) => s.toLowerCase() === req.toLowerCase())
    );
    if (matchedSkills.length > 0) {
      matchedReasons.push(`Matches key skills: ${matchedSkills.slice(0, 3).join(', ')}.`);
      earnedPoints += Math.min(25, matchedSkills.length * 8);
    }

    // Fit 2E: Work Arrangement (Remote / Hybrid / Onsite)
    if (
      profile.employment.workArrangement === 'ANY' ||
      profile.employment.workArrangement === details.workArrangement
    ) {
      matchedReasons.push(`Work format matches preference (${details.workArrangement.toLowerCase()}).`);
      earnedPoints += 15;
    }

    // Strict Sector Targeting Rule:
    // If user explicitly chose specific sectors and this opportunity is NOT in those sectors,
    // cap the maximum score at 58% so it is never presented as "Good Profile Match" or "Strong Profile Match".
    if (!isAnySector && !sectorMatched) {
      earnedPoints = Math.min(58, earnedPoints);
    }
  }

  // -------------------------------------------------------------
  // STEP 3 & 4: CALCULATE FINAL SCORE & APPLY MATCH LABELS (Sheet 18)
  // -------------------------------------------------------------
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
    label,
    score: finalScore,
    displayLabel,
    displayColor,
    gatePassed,
    matchedReasons: matchedReasons.slice(0, 3), // Top 3 reasons
    warnings,
  };
}
