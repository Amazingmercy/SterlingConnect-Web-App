export type PathwayType =
  | 'Career & Employment'
  | 'Education & Scholarships'
  | 'Employment & Career Opportunities'
  | 'Education & Scholarship Opportunities'
  | 'Both Pathways';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  nationality: string;
  isEmailVerified: boolean;
  hasCompletedAssessment?: boolean;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  pathway?: PathwayType;
  primaryGoal?: PathwayType;
  createdAt: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  nationality: string;
  password: string;
  agreeToTerms: boolean;
  pathway?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
