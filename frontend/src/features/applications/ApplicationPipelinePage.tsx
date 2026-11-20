import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FolderOpen,
  Filter,
  Search,
} from 'lucide-react';
import { useApplications } from '../../context/ApplicationContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationMilestoneCheckInModal } from './ApplicationMilestoneCheckInModal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import type { ApplicationStatus } from '../../types/application';

type PipelineFilterTab = 'ALL' | 'PREPARING' | 'APPLIED' | 'INTERVIEW' | 'OUTCOMES';

export const ApplicationPipelinePage: React.FC = () => {
  const { applications, metrics, refreshApplications, addOrUpdateApplication } = useApplications();
  const { opportunities, refreshOpportunities } = useOpportunities();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PipelineFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SCHOLARSHIP' | 'EMPLOYMENT'>('ALL');
  const [checkInApp, setCheckInApp] = useState<(typeof applications)[0] | null>(null);

  useEffect(() => {
    refreshApplications();
    refreshOpportunities();
  }, [refreshApplications, refreshOpportunities]);

  // Map opportunityId and referenceCode -> Opportunity
  const opportunityMap = useMemo(() => {
    const map = new Map<string, (typeof opportunities)[0]>();
    opportunities.forEach((opp) => {
      map.set(opp.id, opp);
      if (opp.referenceCode) {
        map.set(opp.referenceCode, opp);
      }
    });
    return map;
  }, [opportunities]);

  // Automated Milestone & Deadline Follow-Through Pop-up Check-in
  useEffect(() => {
    if (!applications || applications.length === 0) return;

    // Look for active application qualifying for check-in:
    // 1. Deadline within 30 days and status is PREPARING/SAVED
    // 2. Or status is APPLIED, SHORTLISTED, or INTERVIEW
    const candidateApp = applications.find((app) => {
      if (
        app.status === 'OFFER_SUCCESSFUL' ||
        app.status === 'AWARDED' ||
        app.status === 'UNSUCCESSFUL' ||
        app.status === 'WITHDRAWN'
      ) {
        return false;
      }
      if (sessionStorage.getItem(`checkin_prompt_${app.id}`)) {
        return false;
      }

      const opp = app.opportunity || opportunityMap.get(app.opportunityId);
      if (opp?.deadline) {
        const daysLeft = Math.ceil(
          (new Date(opp.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft >= 0 && daysLeft <= 30) {
          return true;
        }
      }

      return (
        app.status === 'APPLIED' ||
        app.status === 'SHORTLISTED' ||
        app.status === 'INTERVIEW'
      );
    });

    if (candidateApp) {
      const timer = setTimeout(() => {
        setCheckInApp(candidateApp);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [applications, opportunityMap]);

  const handleUpdateStatus = async (status: ApplicationStatus, notes?: string) => {
    if (!checkInApp) return;
    await addOrUpdateApplication(checkInApp.opportunityId, status, notes);
    toast(`Milestone updated to ${status}.`);
    sessionStorage.setItem(`checkin_prompt_${checkInApp.id}`, 'true');
    setCheckInApp(null);
    refreshApplications();
  };

  const handleDismissCheckIn = () => {
    if (checkInApp) {
      sessionStorage.setItem(`checkin_prompt_${checkInApp.id}`, 'true');
    }
    setCheckInApp(null);
  };

  // Tab definitions with dynamic counts
  const tabs: { id: PipelineFilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: applications.length },
    { id: 'PREPARING', label: 'In Progress / Preparing', count: metrics.preparing },
    { id: 'APPLIED', label: 'Submitted', count: metrics.applied },
    { id: 'INTERVIEW', label: 'Interview / Shortlisted', count: metrics.inProgress },
    { id: 'OUTCOMES', label: 'Outcomes', count: metrics.outcomes },
  ];

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const opp = app.opportunity || opportunityMap.get(app.opportunityId);

      // Status tab filter
      if (activeTab === 'PREPARING') {
        if (app.status !== 'PREPARING' && app.status !== 'SAVED') return false;
      } else if (activeTab === 'APPLIED') {
        if (app.status !== 'APPLIED') return false;
      } else if (activeTab === 'INTERVIEW') {
        if (app.status !== 'INTERVIEW' && app.status !== 'SHORTLISTED') return false;
      } else if (activeTab === 'OUTCOMES') {
        if (
          app.status !== 'OFFER_SUCCESSFUL' &&
          app.status !== 'AWARDED' &&
          app.status !== 'UNSUCCESSFUL' &&
          app.status !== 'WITHDRAWN'
        )
          return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && opp && opp.opportunityType !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const oppTitle = opp?.title.toLowerCase() || '';
        const oppOrg = opp?.organization.toLowerCase() || '';
        const notes = app.notes?.toLowerCase() || '';
        const refCode = opp?.referenceCode.toLowerCase() || '';
        if (
          !oppTitle.includes(query) &&
          !oppOrg.includes(query) &&
          !notes.includes(query) &&
          !refCode.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [applications, activeTab, typeFilter, searchQuery, opportunityMap]);

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Header with Title & Action (U20: headline & intro) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#edf0f3]">
        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
            STERLING CONNECT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Your application progress
          </h1>
          <p className="text-sm text-[#627086] max-w-xl">
            Record where each application stands and what you need to do next. Your updates help you keep a useful history.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Link to="/saved" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full justify-center">
              Saved opportunities
            </Button>
          </Link>
          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              className="w-full justify-center shadow-sm"
            >
              Browse opportunities
            </Button>
          </Link>
        </div>
      </div>

      {/* Persistent Self-Report Notice (U20: self_report, Always visible) */}
      <div className="p-4 rounded-xl bg-[#f0f8f5] border border-[#bddbd1] text-xs text-[#05644f] flex items-center gap-3">
        <AlertCircle size={18} className="text-[#087b63] flex-shrink-0" />
        <span className="font-medium">
          Application updates are reported by you. Sterling Connect does not submit applications on your behalf.
        </span>
      </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#e4eaf0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#102641]">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#102641] font-brand leading-none">
                {metrics.total}
              </div>
              <div className="text-xs text-[#627086] font-medium mt-1">Total Tracked</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e4eaf0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#102641] font-brand leading-none">
                {metrics.preparing}
              </div>
              <div className="text-xs text-[#627086] font-medium mt-1">In Preparation</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e4eaf0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#102641] font-brand leading-none">
                {metrics.inProgress}
              </div>
              <div className="text-xs text-[#627086] font-medium mt-1">Shortlisted / Interview</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e4eaf0] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e3f4ed] flex items-center justify-center text-[#087b63]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#102641] font-brand leading-none">
                {metrics.outcomes}
              </div>
              <div className="text-xs text-[#627086] font-medium mt-1">Outcomes Secured</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e4eaf0] shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#102641] text-white shadow-sm'
                      : 'bg-slate-50 text-[#627086] hover:bg-slate-100 hover:text-[#102641]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Secondary Filter */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by opportunity, employer, notes, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#f8fafb] border border-[#e4eaf0] rounded-lg text-xs text-[#102641] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#90cfc0]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  typeFilter === 'ALL'
                    ? 'bg-[#e3f4ed] text-[#087b63]'
                    : 'bg-slate-50 text-[#627086] hover:bg-slate-100'
                }`}
              >
                All Pathways
              </button>
              <button
                onClick={() => setTypeFilter('SCHOLARSHIP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  typeFilter === 'SCHOLARSHIP'
                    ? 'bg-[#e3f4ed] text-[#087b63]'
                    : 'bg-slate-50 text-[#627086] hover:bg-slate-100'
                }`}
              >
                <GraduationCap size={13} />
                <span>Scholarships</span>
              </button>
              <button
                onClick={() => setTypeFilter('EMPLOYMENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  typeFilter === 'EMPLOYMENT'
                    ? 'bg-[#e3f4ed] text-[#087b63]'
                    : 'bg-slate-50 text-[#627086] hover:bg-slate-100'
                }`}
              >
                <Briefcase size={13} />
                <span>Jobs</span>
              </button>
            </div>
          </div>
        </div>


        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const opp = application.opportunity || opportunityMap.get(application.opportunityId);
              if (!opp) {
                // Graceful fallback for non-catalog or deleted opportunities
                return (
                  <div
                    key={application.id}
                    className="p-5 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-[#627086] space-y-2"
                  >
                    <div className="font-bold text-[#102641]">
                      Opportunity ID: {application.opportunityId} (Archived or custom record)
                    </div>
                    <div>Status: {application.status}</div>
                    {application.notes && <div>Notes: {application.notes}</div>}
                  </div>
                );
              }

              return (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  opportunity={opp}
                  onStatusChange={() => {
                    // Switch tab to ALL so the application never disappears from the view
                    if (activeTab !== 'ALL') {
                      setActiveTab('ALL');
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State (U20: empty copy) */
          <div className="bg-white rounded-2xl border border-[#e4eaf0] p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#e3f4ed] text-[#087b63] flex items-center justify-center mx-auto">
              <FolderOpen size={30} />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-[#102641] font-brand">
                {searchQuery || typeFilter !== 'ALL' || activeTab !== 'ALL'
                  ? 'No applications match your filter'
                  : 'No applications to track yet.'}
              </h3>
              <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
                {searchQuery || typeFilter !== 'ALL' || activeTab !== 'ALL'
                  ? 'Try clearing your search query or selecting a different status filter tab.'
                  : 'No applications to track yet. Save an opportunity, start preparing or record an application you have submitted.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {searchQuery || typeFilter !== 'ALL' || activeTab !== 'ALL' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveTab('ALL');
                    setTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <>
                  <Link to="/opportunities">
                    <Button variant="primary" size="md">
                      Browse opportunities
                    </Button>
                  </Link>
                  <Link to="/saved">
                    <Button variant="secondary" size="md">
                      Saved opportunities
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Milestone and Deadline Follow-Through Pop-up Modal */}
        {checkInApp && (
          <ApplicationMilestoneCheckInModal
            isOpen={Boolean(checkInApp)}
            onClose={handleDismissCheckIn}
            application={checkInApp}
            opportunity={
              checkInApp.opportunity ||
              opportunityMap.get(checkInApp.opportunityId)
            }
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
  );
};
