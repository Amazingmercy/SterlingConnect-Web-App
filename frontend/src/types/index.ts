export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type Pathway = 'EMPLOYMENT' | 'SCHOLARSHIP';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

// Readiness Bands (SC-03 through SC-06 & D-03)
export type ReadinessBand =
  | 'EMERGING'     // 0 <= score < 25
  | 'FOUNDATIONAL' // 25 <= score < 50
  | 'DEVELOPING'   // 50 <= score < 75
  | 'PROFICIENT';  // 75 <= score <= 100

// Standard Likert 1-5 response values
export type LikertResponse = 1 | 2 | 3 | 4 | 5;

export interface LikertOptionMeta {
  value: LikertResponse;
  label: string;
  explanation: string;
}

export const LIKERT_SCALE_OPTIONS: LikertOptionMeta[] = [
  { value: 1, label: 'Not yet able', explanation: 'I cannot do this yet.' },
  { value: 2, label: 'Beginning', explanation: 'I have limited knowledge or experience.' },
  { value: 3, label: 'Developing', explanation: 'I can do this with guidance.' },
  { value: 4, label: 'Independent', explanation: 'I can do this on my own.' },
  { value: 5, label: 'Proficient', explanation: 'I can do this confidently and consistently.' },
];

export type AssessmentAttemptStatus = 'DRAFT' | 'COMPLETED';

export interface AcademyCategory {
  id: string; // "CAT-01" to "CAT-10"
  name: string;
  description?: string;
  displayOrder: number;
}

export interface AssessmentQuestion {
  id: string;
  versionId: string;
  questionCode: string; // "Q01" to "Q50"
  categoryId: string; // "CAT-01" to "CAT-10"
  categoryName: string;
  orderIndex: number; // 1 to 50
  orderInCategory: number; // 1 to 5
  statement: string;
  construct: string;
}

export interface AssessmentCategoryScore {
  id: string;
  categoryId: string;
  categoryName: string;
  rawTotal: number; // 5 to 25
  scorePercent: number; // 0 to 100
  readinessBand: ReadinessBand;
  lowResponseCount: number;
  priorityRank: number; // 1 to 10
  isTopPriority: boolean; // True for top 3
}

export type CourseLevel = 'ESSENTIALS' | 'FUNDAMENTALS' | 'ADVANCED';

export interface AcademyCourse {
  id: string;
  courseCode: string;
  title: string;
  categoryId: string;
  level: CourseLevel;
  isPublished: boolean;
  priceNGN: number;
  isFree: boolean;
  duration?: string;
  enrollmentUrl: string;
  prerequisiteCourseIds?: string[];
}

export type OpportunityType = 'EMPLOYMENT' | 'SCHOLARSHIP';

export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';

export type MatchLabel =
  | 'POTENTIAL_MATCH'
  | 'RELEVANT'
  | 'GOOD'
  | 'STRONG'
  | 'EXCLUDED';

export type ApplicationStatus =
  | 'SAVED'
  | 'PREPARING'
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER_SUCCESSFUL'
  | 'AWARDED'
  | 'UNSUCCESSFUL'
  | 'WITHDRAWN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  activePathway: Pathway;
  hasCompletedAssessment: boolean;
  lastAssessmentCompletedAt?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}
