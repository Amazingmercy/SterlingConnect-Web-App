import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Award,
  Bookmark,
  FileEdit,
  Send,
  UserCheck,
  PhoneCall,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MailCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchOverview = async (start = startDate, end = endDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      const res = await api.get(`/admin/overview?${params.toString()}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load platform overview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOverview(startDate, endDate);
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#102641]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#e4eaf0] rounded-2xl p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#102641] mb-2">We couldn’t load this information. Please try again.</h3>
        <p className="text-xs text-[#53617d] mb-5">{error || 'Please check your connection and try again.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchOverview()}
            className="px-4 py-2 bg-[#102641] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Try again
          </button>
          {error?.toLowerCase().includes('authentication') && (
            <a
              href="/signin"
              className="px-4 py-2 bg-[#e3f4ed] text-[#087b63] text-xs font-bold rounded-lg hover:bg-[#d5eee5] transition cursor-pointer"
            >
              Sign in as Admin
            </a>
          )}
        </div>
      </div>
    );
  }

  const totalApps = data.applications.total || 1;
  const getPercent = (count: number) => Math.round((count / totalApps) * 100);

  const phase1Total =
    (data.applications.byStage.SAVED || 0) + (data.applications.byStage.PREPARING || 0);
  const phase2Total =
    (data.applications.byStage.APPLIED || 0) +
    (data.applications.byStage.SHORTLISTED || 0) +
    (data.applications.byStage.INTERVIEW || 0);
  const phase3Total =
    (data.applications.byStage.OFFER_SUCCESSFUL || 0) +
    (data.applications.byStage.AWARDED || 0) +
    (data.applications.byStage.UNSUCCESSFUL || 0) +
    (data.applications.byStage.WITHDRAWN || 0);

  const pipelineStages = [
    {
      key: 'SAVED',
      label: 'Saved Opportunities',
      phase: 'Phase 1: Exploration',
      phaseBadge: 'bg-slate-100 text-slate-700 border-slate-200',
      count: data.applications.byStage.SAVED || 0,
      icon: Bookmark,
      iconBg: 'bg-slate-100 text-slate-700',
      barColor: 'bg-slate-500',
    },
    {
      key: 'PREPARING',
      label: 'Preparing Materials',
      phase: 'Phase 1: Exploration',
      phaseBadge: 'bg-amber-50 text-amber-800 border-amber-200',
      count: data.applications.byStage.PREPARING || 0,
      icon: FileEdit,
      iconBg: 'bg-amber-100 text-amber-700',
      barColor: 'bg-amber-500',
    },
    {
      key: 'APPLIED',
      label: 'Official Application Submitted',
      phase: 'Phase 2: In-Flight',
      phaseBadge: 'bg-blue-50 text-blue-800 border-blue-200',
      count: data.applications.byStage.APPLIED || 0,
      icon: Send,
      iconBg: 'bg-blue-100 text-blue-700',
      barColor: 'bg-blue-600',
    },
    {
      key: 'SHORTLISTED',
      label: 'Candidate Shortlisted',
      phase: 'Phase 2: In-Flight',
      phaseBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      count: data.applications.byStage.SHORTLISTED || 0,
      icon: UserCheck,
      iconBg: 'bg-indigo-100 text-indigo-700',
      barColor: 'bg-indigo-600',
    },
    {
      key: 'INTERVIEW',
      label: 'Interview Round Scheduled',
      phase: 'Phase 2: In-Flight',
      phaseBadge: 'bg-purple-50 text-purple-800 border-purple-200',
      count: data.applications.byStage.INTERVIEW || 0,
      icon: PhoneCall,
      iconBg: 'bg-purple-100 text-purple-700',
      barColor: 'bg-purple-600',
    },
    {
      key: 'OFFER_SUCCESSFUL',
      label: 'Formal Job Offer',
      phase: 'Phase 3: Formal Outcome',
      phaseBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      count: data.applications.byStage.OFFER_SUCCESSFUL || 0,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-700',
      barColor: 'bg-emerald-600',
    },
    {
      key: 'AWARDED',
      label: 'Scholarship Awarded',
      phase: 'Phase 3: Formal Outcome',
      phaseBadge: 'bg-teal-50 text-teal-800 border-teal-200',
      count: data.applications.byStage.AWARDED || 0,
      icon: Award,
      iconBg: 'bg-teal-100 text-teal-700',
      barColor: 'bg-teal-600',
    },
    {
      key: 'UNSUCCESSFUL',
      label: 'Not Selected',
      phase: 'Phase 3: Formal Outcome',
      phaseBadge: 'bg-rose-50 text-rose-800 border-rose-200',
      count: data.applications.byStage.UNSUCCESSFUL || 0,
      icon: XCircle,
      iconBg: 'bg-rose-100 text-rose-700',
      barColor: 'bg-rose-500',
    },
    {
      key: 'WITHDRAWN',
      label: 'Application Withdrawn',
      phase: 'Phase 3: Formal Outcome',
      phaseBadge: 'bg-slate-100 text-slate-700 border-slate-200',
      count: data.applications.byStage.WITHDRAWN || 0,
      icon: AlertTriangle,
      iconBg: 'bg-slate-100 text-slate-600',
      barColor: 'bg-slate-400',
    },
  ];

  const totalSent = data.emails?.counts?.SENT || 0;
  const totalFailed = data.emails?.counts?.FAILED || 0;
  const emailTotal = totalSent + totalFailed;
  const emailSuccessRate = emailTotal > 0 ? Math.round((totalSent / emailTotal) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Title & Instruction (A02) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Platform overview</h2>
          <p className="text-sm text-gray-600">
            Review users, readiness, opportunity activity and reported outcomes.
          </p>
        </div>

        {/* Date Filter Form (A02: Apply date filter) */}
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 shadow-xs focus:ring-1 focus:ring-slate-800"
            aria-label="Start Date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-700 shadow-xs focus:ring-1 focus:ring-slate-800"
            aria-label="End Date"
          />
          <button
            type="submit"
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-[#102641] rounded-md hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            Apply date filter
          </button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                fetchOverview('', '');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchOverview(startDate, endDate)}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* A02 State copy: No data is available for this reporting period */}
      {data.users.total === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium text-center">
          No data is available for this reporting period.
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Candidates
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.users.total}</p>
          <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span>{data.users.active} Active</span>
            <span>•</span>
            <span>{data.users.pendingVerification} Unverified</span>
            <span>•</span>
            <span>{data.users.suspended} Suspended</span>
          </div>
        </div>

        {/* Readiness Diagnostic Completed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Readiness Rate
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data.users.readinessCompletionRate}%
          </p>
          <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span>{data.users.readinessCompleted} of {data.users.total} candidates unlocked</span>
          </div>
        </div>

        {/* Total Opportunities */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Opportunities
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.opportunities.total}</p>
          <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span>{data.opportunities.byType.employment} Career</span>
            <span>•</span>
            <span>{data.opportunities.byType.scholarship} Scholarship</span>
          </div>
        </div>

        {/* Pipeline & Delivery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Emails Delivered
            </span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <MailCheck className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {totalSent}
          </p>
          <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span>{data.applications.total} Apps tracked</span>
            <span>•</span>
            <span>{totalFailed} Failed</span>
            <span>•</span>
            <span className="font-semibold text-emerald-600">{emailSuccessRate}%</span>
          </div>
        </div>
      </div>

      {/* Redesigned Spacious Application Pipeline Funnel (Correction 1) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#c59b27]/10 text-[#c59b27] rounded-lg">
                <Award className="w-5 h-5 text-[#c59b27]" />
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                Application Pipeline Funnel
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Spacious conversion overview across Candidate Exploration, In-Flight Review, and Confirmed Outcomes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              {data.applications.total} Total Pipeline Actions
            </span>
            <Link
              to="/admin/applications"
              className="text-xs font-semibold text-[#102641] hover:underline flex items-center gap-1"
            >
              Manage applications <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Phase Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Phase 1: Exploration
            </span>
            <span className="font-bold text-slate-900">{phase1Total}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
            <span className="font-semibold text-blue-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Phase 2: In-Flight Review
            </span>
            <span className="font-bold text-blue-900">{phase2Total}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Phase 3: Formal Outcomes
            </span>
            <span className="font-bold text-emerald-900">{phase3Total}</span>
          </div>
        </div>

        {/* 3 Per Row Pipeline Funnel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineStages.map((st) => {
            const Icon = st.icon;
            const percentage = getPercent(st.count);
            return (
              <div
                key={st.key}
                className="bg-white p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.phaseBadge}`}>
                      {st.phase}
                    </span>
                    <div className={`p-2 rounded-lg ${st.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-snug">{st.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {percentage}% of total pipeline volume
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-bold text-slate-900">{st.count}</span>
                    <span className="text-xs font-semibold text-slate-500">candidates</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.barColor} transition-all duration-300`}
                      style={{
                        width: `${Math.min(100, Math.max(st.count > 0 ? 8 : 0, percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spec A11 & A12 Copy Footnote */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Operational Notice:</strong> Reported outcomes are user declarations unless separately verified. An opportunity click is not a submitted application. A learning click is not an enrolment.
            </span>
          </div>
        </div>
      </div>

      {/* Activity Streams & Dedicated Email Delivery Card (Correction 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Trail (FR-18) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center">
              <Clock className="w-4 h-4 text-slate-500 mr-2" /> Recent Operational Activity (FR-18)
            </h3>
            <Link
              to="/admin/audit"
              className="text-xs font-semibold text-[#102641] hover:underline flex items-center gap-1"
            >
              Full audit log <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 5).map((log: any) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})` : 'System Engine'}
                    </span>
                  </div>
                  <span className="text-slate-400 whitespace-nowrap ml-4">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4">No recent activity recorded.</p>
            )}
          </div>
        </div>

        {/* Gmail SMTP Communications Summary (Correction 2) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <MailCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Gmail SMTP Communications</h3>
                  <p className="text-[11px] text-slate-500">Live transactional transmission health</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                Active Engine
              </span>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-3 gap-2.5 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Sent</span>
                <span className="text-lg font-bold text-slate-900">{totalSent}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-rose-600 uppercase block">Failed</span>
                <span className="text-lg font-bold text-rose-700">{totalFailed}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase block">Success Rate</span>
                <span className="text-lg font-bold text-emerald-700">{emailSuccessRate}%</span>
              </div>
            </div>

            {/* Recent sample transmissions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Latest Transmissions
              </span>
              {data.emails?.recent && data.emails.recent.length > 0 ? (
                data.emails.recent.slice(0, 3).map((em: any) => (
                  <div
                    key={em.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[240px]">
                      <span className="font-semibold text-slate-800 block text-[11px]">{em.triggerType}</span>
                      <span className="text-slate-500 text-[10px] truncate block">{em.recipientEmail}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        em.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {em.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">No email transmissions logged yet.</p>
              )}
            </div>
          </div>

          {/* Direct link to dedicated paginated email delivery log */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to="/admin/email-logs"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs gap-1.5"
            >
              <MailCheck className="w-4 h-4" />
              Open Dedicated Delivery Logs with Filters →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
