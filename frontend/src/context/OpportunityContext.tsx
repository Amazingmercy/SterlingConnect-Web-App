import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Opportunity, MatchEvaluation } from '../types/opportunity';
import { SEED_OPPORTUNITIES } from '../features/opportunities/data/opportunities';
import { evaluateOpportunityMatch } from '../features/opportunities/matchingEngine';
import { useProfile } from './ProfileContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const getSavedOppsKey = (userId?: string) =>
  userId ? `sterling_connect_saved_opportunities_${userId}` : 'sterling_connect_saved_opportunities_guest';

const LEGACY_SAVED_KEY = 'sterling_connect_saved_opportunities';

interface OpportunityContextType {
  opportunities: Opportunity[];
  matchedOpportunities: Opportunity[];
  savedIds: string[];
  toggleSave: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  getEvaluation: (opp: Opportunity) => MatchEvaluation;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTab: 'For You' | 'Closing Soon' | 'New This Week' | 'Saved' | 'All';
  setActiveTab: (tab: 'For You' | 'Closing Soon' | 'New This Week' | 'Saved' | 'All') => void;
  typeFilter: 'All' | 'Scholarships' | 'Jobs' | 'Fellowships' | 'Internships';
  setTypeFilter: (filter: 'All' | 'Scholarships' | 'Jobs' | 'Fellowships' | 'Internships') => void;
  isLoading: boolean;
  refreshOpportunities: () => Promise<void>;
}

const OpportunityContext = createContext<OpportunityContextType | undefined>(undefined);

export const mapBackendOpportunity = (item: any): Opportunity => ({
  id: item.id,
  referenceCode: item.referenceCode,
  opportunityType: item.opportunityType,
  title: item.title,
  organization: item.organization,
  country: item.country,
  location: item.location,
  deadline: item.deadline ? item.deadline.split('T')[0] : '',
  openingDate: item.openingDate ? item.openingDate.split('T')[0] : undefined,
  applicationUrl: item.applicationUrl,
  sourceUrl: item.sourceUrl,
  lastVerifiedAt: item.lastVerifiedAt ? item.lastVerifiedAt.split('T')[0] : '2026-10-25',
  isFeatured: item.isFeatured,
  isNewThisWeek: false,
  overview: item.overview,
  requirements:
    typeof item.requirements === 'string'
      ? item.requirements.split('\n').filter(Boolean)
      : item.requirements || [],
  scholarshipDetails: item.scholarshipDetail
    ? {
        studyLevels: item.scholarshipDetail.studyLevels || [],
        eligibleNationalities: item.scholarshipDetail.eligibleNationalities || [],
        eligibleFields: item.scholarshipDetail.eligibleFields || [],
        academicRequirement: item.scholarshipDetail.academicRequirement || '',
        fundingLevel: item.scholarshipDetail.fundingLevel,
        languageRequirement: item.scholarshipDetail.languageRequirement,
        programStartYear: item.scholarshipDetail.programStartYear,
      }
    : undefined,
  employmentDetails: item.employmentDetail
    ? {
        subType: item.employmentDetail.subType,
        sector: item.employmentDetail.sector,
        function: item.employmentDetail.function,
        workArrangement: item.employmentDetail.workArrangement,
        experienceLevel: item.employmentDetail.experienceLevel,
        minimumEducation: item.employmentDetail.minimumEducation,
        eligibleNationalities: item.employmentDetail.eligibleNationalities || [],
        requiredSkills: item.employmentDetail.requiredSkills || [],
        compensationRange: item.employmentDetail.compensationRange,
      }
    : undefined,
});

export const OpportunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>(SEED_OPPORTUNITIES);
  const [matchedOpportunities, setMatchedOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'For You' | 'Closing Soon' | 'New This Week' | 'Saved' | 'All'>('For You');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Scholarships' | 'Jobs' | 'Fellowships' | 'Internships'>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Clean legacy unscoped saved keys on startup
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_SAVED_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Fetch opportunities from API with fallback to seeds
  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/opportunities?limit=50');
      if (res.data?.opportunities && res.data.opportunities.length > 0) {
        const mapped = res.data.opportunities.map(mapBackendOpportunity);
        setOpportunities(mapped);
      }
    } catch {
      // Keep SEED_OPPORTUNITIES if server is unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Compute or fetch matched opportunities for authenticated user
  const fetchMatchedOpportunities = useCallback(async () => {
    if (!user) {
      setMatchedOpportunities([]);
      return;
    }
    try {
      const res = await api.get('/opportunities/for-you');
      if (res.data?.opportunities && res.data.opportunities.length > 0) {
        const mapped = res.data.opportunities.map(mapBackendOpportunity);
        setMatchedOpportunities(mapped);
        return;
      }
    } catch {
      // Fallback to client-side matching engine
    }

    // Rules-based client matching engine fallback
    const pathwayMatches = opportunities.filter((opp) => {
      const pathway = user?.pathway;
      if (
        pathway === 'Employment & Career Opportunities' ||
        pathway === 'Career & Employment'
      ) {
        return opp.opportunityType === 'EMPLOYMENT';
      }
      if (
        pathway === 'Education & Scholarship Opportunities' ||
        pathway === 'Education & Scholarships'
      ) {
        return opp.opportunityType === 'SCHOLARSHIP';
      }
      return true;
    });

    const evaluated = pathwayMatches
      .map((opp) => ({
        opp,
        eval: evaluateOpportunityMatch(opp, profile, user?.pathway),
      }))
      .filter((item) => item.eval.gatePassed && item.eval.label !== 'EXCLUDED')
      .sort((a, b) => {
        if (b.eval.score !== a.eval.score) {
          return b.eval.score - a.eval.score;
        }
        return new Date(a.opp.deadline).getTime() - new Date(b.opp.deadline).getTime();
      })
      .map((item) => item.opp);

    setMatchedOpportunities(evaluated);
  }, [user, opportunities, profile]);

  useEffect(() => {
    fetchMatchedOpportunities();
  }, [fetchMatchedOpportunities]);

  // Hydrate saved collection from API if authenticated, or reset when unauthenticated
  useEffect(() => {
    fetchOpportunities();

    if (!user) {
      setSavedIds([]);
      return;
    }

    const savedKey = getSavedOppsKey(user.id);
    try {
      const stored = localStorage.getItem(savedKey);
      if (stored) {
        setSavedIds(JSON.parse(stored));
      } else {
        setSavedIds([]);
      }
    } catch {
      setSavedIds([]);
    }

    api
      .get('/opportunities/saved')
      .then((res) => {
        if (res.data?.opportunities) {
          const apiSavedIds = res.data.opportunities.map((o: any) => o.id);
          setSavedIds(apiSavedIds);
          localStorage.setItem(savedKey, JSON.stringify(apiSavedIds));
        } else {
          setSavedIds([]);
          localStorage.removeItem(savedKey);
        }
      })
      .catch(() => {});
  }, [user?.id, fetchOpportunities]);

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = savedIds.includes(id);
    const updated = isCurrentlySaved
      ? savedIds.filter((item) => item !== id)
      : [...savedIds, id];

    setSavedIds(updated);
    const savedKey = getSavedOppsKey(user?.id);
    localStorage.setItem(savedKey, JSON.stringify(updated));

    if (user) {
      try {
        await api.post(`/opportunities/${id}/save`);
      } catch {
        // silent fallback
      }
    }
  };

  const isSaved = (id: string) => savedIds.includes(id);

  const getEvaluation = (opp: Opportunity): MatchEvaluation => {
    const evaluation = evaluateOpportunityMatch(opp, profile, user?.pathway);
    return {
      ...evaluation,
      isSaved: isSaved(opp.id),
    };
  };

  return (
    <OpportunityContext.Provider
      value={{
        opportunities,
        matchedOpportunities,
        savedIds,
        toggleSave,
        isSaved,
        getEvaluation,
        searchTerm,
        setSearchTerm,
        activeTab,
        setActiveTab,
        typeFilter,
        setTypeFilter,
        isLoading,
        refreshOpportunities: fetchOpportunities,
      }}
    >
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunityContext);
  if (!context) {
    throw new Error('useOpportunities must be used within an OpportunityProvider');
  }
  return context;
};
