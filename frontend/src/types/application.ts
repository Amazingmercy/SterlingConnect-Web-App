import type { Opportunity } from './opportunity';

export type ApplicationStatus =
  | 'SAVED'
  | 'PREPARING'
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER_SUCCESSFUL' // Employment terminal outcome
  | 'AWARDED'          // Scholarship terminal outcome
  | 'UNSUCCESSFUL'     // Terminal outcome
  | 'WITHDRAWN';       // Terminal outcome

export interface ApplicationStatusHistory {
  id: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  notes?: string;
  changedAt: string;
}

export interface UserApplication {
  id: string;
  opportunityId: string;
  status: ApplicationStatus;
  appliedAt?: string;
  outcomeAt?: string;
  interviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history: ApplicationStatusHistory[];
  opportunity?: Opportunity;
}
