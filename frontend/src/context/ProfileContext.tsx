import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  FullProfile,
  CommonProfileData,
  EmploymentProfileData,
  ScholarshipProfileData,
  UserUploadedDocument,
} from '../types/profile';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const getUserProfileKey = (userId?: string) =>
  userId ? `sterling_connect_profile_${userId}` : 'sterling_connect_profile_guest';

const LEGACY_PROFILE_KEY = 'sterling_connect_profile_v2';

export const INITIAL_COMMON: CommonProfileData = {
  countryOfResidence: 'Nigeria',
  nationalities: ['Nigerian'],
  currentStatus: 'Recent Graduate',
  highestQualification: 'Bachelor’s degree',
  fieldOfStudy: 'Economics',
  institution: '',
  graduationYear: new Date().getFullYear().toString(),
  academicClassification: 'First Class Honours (or equivalent)',
  cvDocument: null,
};

export const INITIAL_EMPLOYMENT: EmploymentProfileData = {
  employmentStatus: 'Seeking opportunity',
  yearsOfExperience: '1-2',
  careerLevel: 'Entry-level',
  sectorsOfInterest: ['Technology & Software', 'Finance & Banking', 'Development & Non-Profit'],
  functionsOfInterest: ['Operations & Project Management', 'Product & Design', 'Data & Analytics'],
  skills: ['Project Management', 'Research & Analysis', 'Communication', 'Strategic Planning'],
  preferredLocations: ['Nigeria', 'United Kingdom', 'Remote (Global)'],
  workArrangement: 'HYBRID',
  opportunityTypes: ['Graduate programme', 'Full-time', 'Fellowship'],
  workAuthorisation: ['Nigeria'],
};

export const INITIAL_SCHOLARSHIP: ScholarshipProfileData = {
  desiredStudyLevels: ["Master's Degree"],
  desiredFields: ['Economics & Public Policy', 'Development Studies', 'Data Science & AI'],
  academicClassification: 'First Class Honours (GPA 3.8/4.0+)',
  preferredStudyCountries: ['United Kingdom', 'United States', 'Canada', 'Germany'],
  fundingRequirement: 'FULLY_FUNDED',
  intendedStartYear: (new Date().getFullYear() + 1).toString(),
  languageTestStatus: 'Planning to take (IELTS / TOEFL)',
  researchInterests: [],
};

export function calculateCompletion(
  common: CommonProfileData,
  employment: EmploymentProfileData,
  scholarship: ScholarshipProfileData,
  documents: UserUploadedDocument[],
  pathway?: string
): number {
  let totalPoints = 0;
  let earnedPoints = 0;

  // Common fields (40 points)
  totalPoints += 40;
  if (common.countryOfResidence) earnedPoints += 8;
  if (common.nationalities && common.nationalities.length > 0) earnedPoints += 8;
  if (common.currentStatus) earnedPoints += 8;
  if (common.highestQualification) earnedPoints += 8;
  if (common.fieldOfStudy) earnedPoints += 8;

  // Pathway specific
  const isEmp = !pathway || pathway.includes('Employment') || pathway.includes('Both');
  const isSch = !pathway || pathway.includes('Scholarship') || pathway.includes('Both');

  if (isEmp) {
    totalPoints += 40;
    if (employment.employmentStatus) earnedPoints += 8;
    if (employment.careerLevel) earnedPoints += 8;
    if (employment.sectorsOfInterest.length > 0) earnedPoints += 8;
    if (employment.skills.length > 0) earnedPoints += 8;
    if (employment.preferredLocations.length > 0) earnedPoints += 8;
  }

  if (isSch) {
    totalPoints += 30;
    if (scholarship.desiredStudyLevels.length > 0) earnedPoints += 7;
    if (scholarship.desiredFields.length > 0) earnedPoints += 7;
    if (scholarship.academicClassification) earnedPoints += 8;
    if (scholarship.preferredStudyCountries.length > 0) earnedPoints += 8;
  }

  // Documents
  totalPoints += 10;
  if (documents && documents.length > 0) earnedPoints += 10;

  if (totalPoints === 0) return 0;
  return Math.round((earnedPoints / totalPoints) * 100);
}

interface ProfileContextType {
  profile: FullProfile;
  updateCommon: (data: Partial<CommonProfileData>) => void;
  updateEmployment: (data: Partial<EmploymentProfileData>) => void;
  updateScholarship: (data: Partial<ScholarshipProfileData>) => void;
  addDocument: (doc: Omit<UserUploadedDocument, 'id' | 'uploadedAt'>) => void;
  removeDocument: (id: string) => void;
  saveProfile: () => Promise<void>;
  isSaving: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [common, setCommon] = useState<CommonProfileData>(() => {
    return {
      ...INITIAL_COMMON,
      countryOfResidence: user?.country || INITIAL_COMMON.countryOfResidence,
      nationalities: user?.nationality ? [user.nationality] : INITIAL_COMMON.nationalities,
    };
  });

  const [employment, setEmployment] = useState<EmploymentProfileData>(INITIAL_EMPLOYMENT);
  const [scholarship, setScholarship] = useState<ScholarshipProfileData>(INITIAL_SCHOLARSHIP);
  const [documents, setDocuments] = useState<UserUploadedDocument[]>([]);

  // Clean legacy unscoped profile on startup
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_PROFILE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Load profile from API when authenticated or reset on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCommon(INITIAL_COMMON);
      setEmployment(INITIAL_EMPLOYMENT);
      setScholarship(INITIAL_SCHOLARSHIP);
      setDocuments([]);
      return;
    }

    const profileKey = getUserProfileKey(user.id);

    // Initial local read for this specific user
    try {
      const stored = localStorage.getItem(profileKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.common) setCommon(parsed.common);
        if (parsed.employment) setEmployment(parsed.employment);
        if (parsed.scholarship) setScholarship(parsed.scholarship);
        if (parsed.documents) setDocuments(parsed.documents);
      }
    } catch {}

    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.profile) {
          const p = res.data.profile;
          if (p.common) {
            setCommon((prev) => ({
              ...prev,
              countryOfResidence: p.common.locationCountry || prev.countryOfResidence,
              nationalities: p.common.nationalities || prev.nationalities,
              currentStatus: p.common.currentStatus || prev.currentStatus,
              highestQualification: p.common.highestQualification || prev.highestQualification,
              fieldOfStudy: p.common.fieldOfStudy || prev.fieldOfStudy,
              graduationYear: p.common.graduationYear?.toString() || prev.graduationYear,
            }));
          }
          if (p.employment) {
            setEmployment((prev) => ({
              ...prev,
              employmentStatus: p.employment.employmentStatus ?? prev.employmentStatus,
              yearsOfExperience: p.employment.yearsOfExperience !== undefined ? String(p.employment.yearsOfExperience) : prev.yearsOfExperience,
              careerLevel: p.employment.careerLevel ?? prev.careerLevel,
              sectorsOfInterest: Array.isArray(p.employment.sectorsOfInterest)
                ? p.employment.sectorsOfInterest
                : prev.sectorsOfInterest,
              functionsOfInterest: Array.isArray(p.employment.functionsOfInterest)
                ? p.employment.functionsOfInterest
                : prev.functionsOfInterest,
              skills: Array.isArray(p.employment.skills)
                ? p.employment.skills
                : prev.skills,
              preferredLocations: Array.isArray(p.employment.preferredLocations)
                ? p.employment.preferredLocations
                : prev.preferredLocations,
              workArrangement: p.employment.workArrangement ?? prev.workArrangement,
              opportunityTypes: Array.isArray(p.employment.opportunityTypes)
                ? p.employment.opportunityTypes
                : prev.opportunityTypes,
              workAuthorisation: p.employment.workAuthorisation ?? prev.workAuthorisation,
            }));
          }
          if (p.scholarship) {
            setScholarship((prev) => ({
              ...prev,
              desiredStudyLevels: p.scholarship.desiredStudyLevels || prev.desiredStudyLevels,
              desiredFields: p.scholarship.desiredFields || prev.desiredFields,
              academicClassification: p.scholarship.academicClassification || prev.academicClassification,
              preferredStudyCountries: p.scholarship.preferredStudyCountries || prev.preferredStudyCountries,
            }));
          }
        }
      } catch {
        // Keep cached
      }
    };

    fetchProfile();
  }, [user?.id, isAuthenticated]);

  const completionPercentage = calculateCompletion(
    common,
    employment,
    scholarship,
    documents,
    user?.pathway
  );

  const updateCommon = (data: Partial<CommonProfileData>) => {
    setCommon((prev) => ({ ...prev, ...data }));
  };

  const updateEmployment = (data: Partial<EmploymentProfileData>) => {
    setEmployment((prev) => ({ ...prev, ...data }));
  };

  const updateScholarship = (data: Partial<ScholarshipProfileData>) => {
    setScholarship((prev) => ({ ...prev, ...data }));
  };

  const addDocument = (doc: Omit<UserUploadedDocument, 'id' | 'uploadedAt'>) => {
    const newDoc: UserUploadedDocument = {
      ...doc,
      id: 'doc_' + Math.random().toString(36).substring(2, 9),
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const saveProfile = async (): Promise<void> => {
    setIsSaving(true);
    const fullProfile: FullProfile = {
      common,
      employment,
      scholarship,
      documents,
      completionPercentage,
    };
    localStorage.setItem(getUserProfileKey(user?.id), JSON.stringify(fullProfile));

    try {
      await Promise.all([
        api.put('/users/profile/common', {
          countryOfResidence: common.countryOfResidence,
          nationalities: common.nationalities,
          currentStatus: common.currentStatus,
          highestQualification: common.highestQualification,
          fieldOfStudy: common.fieldOfStudy,
          graduationYear: common.graduationYear,
          academicClassification: common.academicClassification,
          institution: common.institution,
          cvDocument: common.cvDocument,
        }),
        api.put('/users/profile/employment', {
          employmentStatus: employment.employmentStatus,
          yearsOfExperience: employment.yearsOfExperience,
          careerLevel: employment.careerLevel,
          sector_preference_mode: employment.sector_preference_mode,
          sector_ids: employment.sector_ids,
          sectorsOfInterest: employment.sectorsOfInterest,
          function_preference_mode: employment.function_preference_mode,
          function_ids: employment.function_ids,
          functionsOfInterest: employment.functionsOfInterest,
          skills: employment.skills,
          preferredLocations: employment.preferredLocations,
          workArrangement: employment.workArrangement,
          opportunityTypes: employment.opportunityTypes,
          workAuthorisation: employment.workAuthorisation,
        }),
        api.put('/users/profile/scholarship', {
          desiredStudyLevels: scholarship.desiredStudyLevels,
          desiredFields: scholarship.desiredFields,
          academicClassification: scholarship.academicClassification,
          preferredStudyCountries: scholarship.preferredStudyCountries,
          noPreferredCountry: scholarship.noPreferredCountry,
          fundingRequirement: scholarship.fundingRequirement,
          intendedStartYear: scholarship.intendedStartYear,
          languageTestStatus: scholarship.languageTestStatus,
          researchInterests: scholarship.researchInterests,
          dateOfBirth: scholarship.dateOfBirth,
        }),
      ]);
    } catch {}

    setIsSaving(false);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile: {
          common,
          employment,
          scholarship,
          documents,
          completionPercentage,
        },
        updateCommon,
        updateEmployment,
        updateScholarship,
        addDocument,
        removeDocument,
        saveProfile,
        isSaving,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
