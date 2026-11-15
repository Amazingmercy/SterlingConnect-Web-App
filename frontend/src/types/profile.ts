export type HighestQualification =
  | 'Secondary school'
  | "Bachelor’s degree"
  | "Master’s degree"
  | 'Doctorate or PhD'
  | 'Other qualification'
  | string;

export type CurrentStatus =
  | 'Employed full-time'
  | 'Employed part-time'
  | 'Self-employed / Freelance'
  | 'Recent Graduate'
  | 'Final Year Student'
  | 'Undergraduate Student'
  | 'Seeking opportunity'
  | 'Other';

export type WorkArrangement = 'Remote' | 'Hybrid' | 'On-site' | 'Any arrangement' | 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY' | string;

export type FundingRequirement = 'Full funding' | 'Partial funding' | 'Any funding level' | 'FULLY_FUNDED' | 'PARTIAL' | 'ANY' | string;

export type SectorPreferenceMode = 'selected' | 'any' | 'undecided';
export type FunctionPreferenceMode = 'selected' | 'any' | 'undecided';

export type DocumentCategory =
  | 'CV / Resume'
  | 'Academic Transcript'
  | 'Degree Certificate'
  | 'Statement of Purpose / Cover Letter'
  | 'Academic Reference Letter'
  | 'Professional Reference Letter'
  | 'Language Test Result (IELTS / TOEFL)'
  | 'Portfolio / Writing Sample'
  | 'Identification / Passport'
  | 'Other Supporting Document';

export interface UserUploadedDocument {
  id: string;
  name: string; // original file name
  label: string; // user-defined label or title
  category: DocumentCategory | string;
  size: number;
  uploadedAt: string;
  type?: 'CV_RESUME' | 'ACADEMIC_TRANSCRIPT' | 'OTHER' | string;
}

export interface CommonProfileData {
  countryOfResidence: string;
  nationalities: string[];
  currentStatus: CurrentStatus | string;
  highestQualification: HighestQualification | string;
  fieldOfStudy?: string;
  institution?: string;
  graduationYear?: string;
  academicClassification?: string;
  cvDocument?: UserUploadedDocument | null;
}

export interface EmploymentProfileData {
  employmentStatus: string;
  yearsOfExperience: string | number; // '0', '1', '2', etc.
  careerLevel: 'Entry-level' | 'Mid-level' | 'Senior' | 'Executive' | string;
  sector_preference_mode?: SectorPreferenceMode;
  sector_ids?: string[];
  sectorsOfInterest: string[];
  function_preference_mode?: FunctionPreferenceMode;
  function_ids?: string[];
  functionsOfInterest: string[];
  skills: string[];
  preferredLocations: string[];
  workArrangement: WorkArrangement | string;
  opportunityTypes: string[]; // ['Job', 'Internship', 'Graduate programme', 'Fellowship']
  workAuthorisation: Record<string, 'Yes' | 'No' | 'Not sure'> | string[];
}

export interface ScholarshipProfileData {
  desiredStudyLevels: string[]; // ["Undergraduate", "Master’s", "PhD", "Professional study"]
  desiredFields: string[];
  academicClassification: string;
  preferredStudyCountries: string[];
  noPreferredCountry?: boolean;
  fundingRequirement: FundingRequirement | string;
  intendedStartYear: string;
  languageTestStatus: string;
  researchInterests: string[] | string;
  dateOfBirth?: string;
}

export interface FullProfile {
  common: CommonProfileData;
  employment: EmploymentProfileData;
  scholarship: ScholarshipProfileData;
  documents: UserUploadedDocument[];
  completionPercentage: number;
}
