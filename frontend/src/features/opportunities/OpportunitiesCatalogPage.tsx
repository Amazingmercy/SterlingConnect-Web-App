import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useOpportunities } from '../../context/OpportunityContext';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { OpportunityCard } from './OpportunityCard';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { areSectorsMatching } from './matchingEngine';

export interface OpportunitiesCatalogPageProps {
  initialTab?: 'For you' | 'Explore all' | 'Closing soon';
}

export const OpportunitiesCatalogPage: React.FC<OpportunitiesCatalogPageProps> = ({
  initialTab,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { opportunities, searchTerm, setSearchTerm, getEvaluation } = useOpportunities();
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfile();

  // Determine initial feed tab:
  // Authenticated users default to 'For you' (U17); visitors default to 'Explore all' (U02)
  const paramTab = searchParams.get('tab');
  const getInitialTab = (): 'For you' | 'Explore all' | 'Closing soon' => {
    if (initialTab) return initialTab;
    if (paramTab) {
      const lower = paramTab.toLowerCase();
      if (lower.includes('for') || lower.includes('you')) return 'For you';
      if (lower.includes('closing')) return 'Closing soon';
      if (lower.includes('explore') || lower.includes('all')) return 'Explore all';
    }
    return isAuthenticated ? 'For you' : 'Explore all';
  };

  const [feedTab, setFeedTab] = useState<'For you' | 'Explore all' | 'Closing soon'>(getInitialTab);

  // Sync state if initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setFeedTab(initialTab);
    }
  }, [initialTab]);

  // Pathway Tab: All, Career & Employment, Education & Scholarships
  const [pathwayFilter, setPathwayFilter] = useState<
    'All' | 'Career & Employment' | 'Education & Scholarships'
  >('All');
  const [sortBy, setSortBy] = useState<'newest' | 'closing_soon'>('newest');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [page, setPage] = useState<number>(1);
  const pageSize = 9;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, feedTab, pathwayFilter, selectedCountry, selectedType, sortBy]);

  // Candidate's active pathway label
  const userPathwayLabel = useMemo(() => {
    if (!user?.pathway) return null;
    if (
      user.pathway === 'Employment & Career Opportunities' ||
      user.pathway === 'Career & Employment'
    ) {
      return 'Career & Employment';
    }
    if (
      user.pathway === 'Education & Scholarship Opportunities' ||
      user.pathway === 'Education & Scholarships'
    ) {
      return 'Education & Scholarships';
    }
    return user.pathway;
  }, [user?.pathway]);

  // -------------------------------------------------------------
  // Filter & Personalization Logic
  // -------------------------------------------------------------
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // 1. Text Search Filter
        const query = searchTerm.toLowerCase().trim();
        if (query) {
          const matchTitle = opp.title.toLowerCase().includes(query);
          const matchOrg = opp.organization.toLowerCase().includes(query);
          const matchCountry = opp.country.toLowerCase().includes(query);
          const matchLocation = opp.location.toLowerCase().includes(query);
          const matchSector =
            opp.employmentDetails?.sector.toLowerCase().includes(query) || false;
          const matchField =
            opp.scholarshipDetails?.eligibleFields.some((f) =>
              f.toLowerCase().includes(query),
            ) || false;
          if (
            !matchTitle &&
            !matchOrg &&
            !matchCountry &&
            !matchLocation &&
            !matchSector &&
            !matchField
          ) {
            return false;
          }
        }

        // 2. Personalised Feed ('For you' tab - U17)
        if (feedTab === 'For you' && isAuthenticated) {
          const evaluation = getEvaluation(opp);

          // Hard Eligibility Gate: Failed gates NEVER appear in the personalised feed (Sheet 18 / U17)
          if (!evaluation.gatePassed || evaluation.label === 'EXCLUDED') {
            return false;
          }

          // Filter by active candidate pathway
          if (userPathwayLabel === 'Career & Employment' && opp.opportunityType !== 'EMPLOYMENT') {
            return false;
          }
          if (userPathwayLabel === 'Education & Scholarships' && opp.opportunityType !== 'SCHOLARSHIP') {
            return false;
          }

          // Optional pathway sub-filter override within 'For you'
          if (pathwayFilter === 'Education & Scholarships' && opp.opportunityType !== 'SCHOLARSHIP') {
            return false;
          }
          if (pathwayFilter === 'Career & Employment' && opp.opportunityType !== 'EMPLOYMENT') {
            return false;
          }

          return true;
        }

        // 3. Pathway Tabs Filter (when in Explore all or Closing soon)
        if (pathwayFilter === 'Education & Scholarships') {
          if (opp.opportunityType !== 'SCHOLARSHIP') return false;
        }
        if (pathwayFilter === 'Career & Employment') {
          if (opp.opportunityType !== 'EMPLOYMENT') return false;
        }

        // 4. Country Filter
        if (selectedCountry !== 'All' && opp.country !== selectedCountry) {
          return false;
        }

        // 5. Opportunity Type Filter
        if (selectedType !== 'All') {
          if (selectedType === 'Scholarship' && opp.opportunityType !== 'SCHOLARSHIP')
            return false;
          if (selectedType === 'Employment' && opp.opportunityType !== 'EMPLOYMENT')
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        // In "For you" tab, sort by Match Quality / Fit Score descending, then deadline ascending
        if (feedTab === 'For you' && isAuthenticated) {
          const evalA = getEvaluation(a);
          const evalB = getEvaluation(b);

          if (evalB.score !== evalA.score) {
            return evalB.score - evalA.score;
          }
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }

        // In "Closing soon" tab, sort strictly by nearest deadline
        if (feedTab === 'Closing soon' || sortBy === 'closing_soon') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }

        // Newest first default
        return (b.isNewThisWeek ? 1 : 0) - (a.isNewThisWeek ? 1 : 0);
      });
  }, [
    opportunities,
    searchTerm,
    feedTab,
    isAuthenticated,
    userPathwayLabel,
    pathwayFilter,
    selectedCountry,
    selectedType,
    sortBy,
    getEvaluation,
  ]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setPathwayFilter('All');
    setSelectedCountry('All');
    setSelectedType('All');
  };

  const profileScore = profile.completionPercentage ?? 0;
  const isProfileIncomplete = isAuthenticated && profileScore < 100;

  const candidateSectors = profile.employment.sectorsOfInterest || [];
  const hasSpecificSectorPreference =
    userPathwayLabel === 'Career & Employment' &&
    profile.employment.sector_preference_mode !== 'any' &&
    candidateSectors.length > 0 &&
    !candidateSectors.includes('Open to any sector');

  const matchingSectorCount = useMemo(() => {
    if (!hasSpecificSectorPreference) return filteredOpportunities.length;
    return filteredOpportunities.filter(
      (opp) =>
        opp.opportunityType === 'EMPLOYMENT' &&
        opp.employmentDetails?.sector &&
        candidateSectors.some((s) => areSectorsMatching(s, opp.employmentDetails?.sector))
    ).length;
  }, [filteredOpportunities, hasSpecificSectorPreference, candidateSectors]);

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Heading */}
      <div className="space-y-2">
        <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#112440] tracking-tight">
          {feedTab === 'For you'
            ? 'Opportunities to explore'
            : feedTab === 'Closing soon'
            ? 'Closing soon'
            : 'Explore opportunities'}
        </h1>
        <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
          {feedTab === 'For you'
            ? 'These suggestions use your profile and preferences. Review the requirements before deciding where to apply.'
            : feedTab === 'Closing soon'
            ? 'Opportunities with upcoming deadlines closing in the next 30 days.'
            : 'Find jobs, internships, fellowships and scholarships worth exploring.'}
        </p>

        {/* Search Bar */}
        <div className="relative pt-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search opportunities, organisations or study fields"
            className="w-full h-[52px] pl-11 pr-4 rounded-[10px] bg-white border border-[#e4eaf0] text-[13px] text-[#10223c] placeholder:text-[#627086] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#90cfc0]"
          />
          <Search size={17} className="absolute left-4 top-[27px] text-[#627086]" />
        </div>
      </div>

      {/* Primary Feed Navigation Tabs (U17 Feed tabs: For you | Explore all | Closing soon) */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 border-b border-[#edf0f3] pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setFeedTab('For you');
              setSearchParams({ tab: 'for-you' });
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              feedTab === 'For you'
                ? 'bg-[#087b63] text-white shadow-xs'
                : 'bg-white text-[#526078] border border-[#e4eaf0] hover:border-[#b8dcd0]'
            }`}
          >
            <Compass size={14} />
            <span>For you</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedTab('Explore all');
              setSearchParams({ tab: 'explore' });
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              feedTab === 'Explore all'
                ? 'bg-[#102641] text-white shadow-xs'
                : 'bg-white text-[#526078] border border-[#e4eaf0] hover:border-[#b8dcd0]'
            }`}
          >
            <Compass size={14} />
            <span>Explore all</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedTab('Closing soon');
              setSearchParams({ tab: 'closing-soon' });
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              feedTab === 'Closing soon'
                ? 'bg-[#102641] text-white shadow-xs'
                : 'bg-white text-[#526078] border border-[#e4eaf0] hover:border-[#b8dcd0]'
            }`}
          >
            <Clock size={14} />
            <span>Closing soon</span>
          </button>
        </div>
      )}

      {/* Profile Incomplete Nudge Banner on 'For you' Feed (U17: Low profile coverage) */}
      {feedTab === 'For you' && isProfileIncomplete && (
        <div className="p-4 sm:p-5 rounded-xl border border-[#bddbd1] bg-[#f0f9f6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#05644f] flex items-center gap-1.5">
              <UserCheck size={15} />
              <span>Complete your profile to make these suggestions more useful.</span>
            </h4>
            <p className="text-[11px] text-[#526078]">
              Your profile strength is currently {profileScore}%. Adding transcripts, classifications, or
              career preferences unlocks higher match precision.
            </p>
          </div>
          <Link to="/profile">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={13} />}>
              Update my profile
            </Button>
          </Link>
        </div>
      )}

      {/* Pathway Sub-tabs & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#edf0f3] pb-3">
        {/* Pathway Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'All', label: 'All Opportunities' },
            { id: 'Career & Employment', label: 'Career & Employment' },
            { id: 'Education & Scholarships', label: 'Education & Scholarships' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPathwayFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                pathwayFilter === tab.id
                  ? 'bg-[#102641] text-white shadow-xs'
                  : 'bg-white text-[#526078] border border-[#e4eaf0] hover:border-[#b8dcd0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isFilterPanelOpen || selectedCountry !== 'All' || selectedType !== 'All'
                ? 'bg-[#087b63] text-white border-[#087b63]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:border-[#b8dcd0]'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
          </button>

          {/* Sort Options */}
          {feedTab !== 'For you' && feedTab !== 'Closing soon' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#627086]">Sort:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`font-semibold cursor-pointer ${
                  sortBy === 'newest'
                    ? 'text-[#087b63] underline'
                    : 'text-[#627086] hover:text-[#102641]'
                }`}
              >
                Newest first
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSortBy('closing_soon')}
                className={`font-semibold cursor-pointer ${
                  sortBy === 'closing_soon'
                    ? 'text-[#087b63] underline'
                    : 'text-[#627086] hover:text-[#102641]'
                }`}
              >
                Closing soon
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Filter Controls Panel */}
      {isFilterPanelOpen && (
        <div className="p-4 rounded-xl bg-white border border-[#e4eaf0] space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#102641] mb-1">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#e4eaf0] bg-white text-[#10223c]"
              >
                <option value="All">All Countries</option>
                <option value="Nigeria">Nigeria</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Global">Global</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#102641] mb-1">
                Opportunity Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#e4eaf0] bg-white text-[#10223c]"
              >
                <option value="All">All Types</option>
                <option value="Employment">Career & Employment</option>
                <option value="Scholarship">Education & Scholarships</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#edf0f3]">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFilterPanelOpen(false)}
              >
                Apply filters
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-xs font-bold text-[#087b63]"
            >
              Show {filteredOpportunities.length} results
            </Button>
          </div>
        </div>
      )}

      {/* Registration Prompt Panel for Unauthenticated Visitors (U02) */}
      {!isAuthenticated && (
        <div className="p-4 sm:p-5 rounded-xl border border-[#bddbd1] bg-[#e3f4ed]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#05644f]">
              Sign in to see why opportunities may be relevant to you.
            </h4>
            <p className="text-[11px] text-[#526078]">
              Unlock transparent rules-based match scoring, personalized filters, and progress tracking.
            </p>
          </div>
          <Link to="/sign-in">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={13} />}>
              Sign in
            </Button>
          </Link>
        </div>
      )}

      {/* Results Count & Current Active Pathway Filter notice */}
      <div className="flex items-center justify-between text-xs text-[#627086] font-medium">
        <span>{filteredOpportunities.length} opportunities found</span>
        {feedTab === 'For you' && userPathwayLabel && (
          <span className="text-[11px] text-[#087b63] font-semibold">
            Filtered for your target goal: {userPathwayLabel}
          </span>
        )}
      </div>

      {/* Target Sector Availability Notice */}
      {feedTab === 'For you' && hasSpecificSectorPreference && matchingSectorCount === 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              No active vacancies currently open in your selected sector ({candidateSectors.slice(0, 3).join(', ')}{candidateSectors.length > 3 ? '...' : ''})
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Displaying opportunities in other sectors that match your general qualifications, work arrangement, and transferable skills. You can refine your sector choices anytime in your profile.
            </p>
          </div>
        </div>
      )}

      {/* Opportunities Grid */}
      {filteredOpportunities.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOpportunities
              .slice((page - 1) * pageSize, page * pageSize)
              .map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
          </div>

          {Math.ceil(filteredOpportunities.length / pageSize) > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredOpportunities.length / pageSize)}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                totalItems={filteredOpportunities.length}
                pageSize={pageSize}
                itemLabel="opportunities"
              />
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-xl border border-[#e4eaf0] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#f8fafb] text-[#627086] grid place-items-center mx-auto">
            <Search size={22} />
          </div>

          {feedTab === 'For you' ? (
            <div className="space-y-2">
              <h3 className="font-brand font-bold text-base text-[#102641]">
                No personalized suggestions found
              </h3>
              <p className="text-xs text-[#627086] max-w-md mx-auto leading-relaxed">
                We haven’t found personalised suggestions for your current profile. Try Explore all
                or update your preferences.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setFeedTab('Explore all');
                    setSearchParams({ tab: 'explore' });
                  }}
                >
                  Explore all opportunities
                </Button>
                <Link to="/profile">
                  <Button variant="secondary" size="sm">
                    Update my profile
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-brand font-bold text-base text-[#102641]">
                No opportunities match these filters.
              </h3>
              <p className="text-xs text-[#627086] max-w-sm mx-auto">
                No opportunities match these filters. Try another search or clear your filters.
              </p>
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
