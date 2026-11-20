import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Target,
  ShieldCheck,
  Clock,
  Share2,
  Sparkles,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { useOpportunities } from '../../context/OpportunityContext';
import { useApplications } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { HaveYouAppliedModal } from './HaveYouAppliedModal';
import {
  trackOpportunityViewed,
  trackOpportunitySaved,
  trackOpportunityApplied,
} from '../../utils/analytics';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { opportunities, toggleSave, isSaved, getEvaluation } = useOpportunities();
  const { addOrUpdateApplication, removeApplication, getApplicationByOppId } = useApplications();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'application'>('overview');
  const [aiMatchData, setAiMatchData] = useState<any | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [showAppliedPrompt, setShowAppliedPrompt] = useState<boolean>(false);

  const opp = opportunities.find((o) => o.id === id);

  useEffect(() => {
    if (isAuthenticated && opp?.id) {
      setIsLoadingAi(true);
      api
        .get(`/opportunities/${opp.id}/ai-match-explanation`)
        .then((res) => {
          if (res.data?.success && res.data?.aiExplanation) {
            setAiMatchData(res.data.aiExplanation);
          }
        })
        .catch(() => {
          // Graceful fallback to rules engine
        })
        .finally(() => {
          setIsLoadingAi(false);
        });
    }
  }, [isAuthenticated, opp?.id]);

  if (!opp) {
    return <NotFoundPage />;
  }

  const saved = isSaved(opp.id);
  const evaluation = getEvaluation(opp);
  const existingApp = getApplicationByOppId(opp.id);

  const deadlineDate = new Date(opp.deadline);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Prompt user if they have applied when visiting details
  useEffect(() => {
    if (!isAuthenticated || !opp?.id) return;
    const hasAlreadyApplied =
      existingApp &&
      existingApp.status !== 'PREPARING' &&
      existingApp.status !== 'SAVED';
    const isDismissed = sessionStorage.getItem(`dismissed_applied_prompt_${opp.id}`);

    if (!hasAlreadyApplied && !isDismissed) {
      const timer = setTimeout(() => {
        setShowAppliedPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, opp?.id, existingApp]);

  const handleConfirmApplied = async () => {
    if (!opp) return;
    await addOrUpdateApplication(
      opp.id,
      'APPLIED',
      'Marked as applied from opportunity detail check-in.',
      new Date().toISOString().split('T')[0],
    );
    toast('Application added to your tracker! Follow your milestones here.');
    setShowAppliedPrompt(false);
    navigate('/applications');
  };

  const handleDismissAppliedPrompt = () => {
    if (opp?.id) {
      sessionStorage.setItem(`dismissed_applied_prompt_${opp.id}`, 'true');
    }
    setShowAppliedPrompt(false);
  };
  const isClosed = diffDays < 0;

  const isScholarship = opp.opportunityType === 'SCHOLARSHIP';

  let matchBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  if (evaluation.displayColor === 'emerald') {
    matchBadgeColor = 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';
  } else if (evaluation.displayColor === 'amber') {
    matchBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (evaluation.displayColor === 'slate') {
    matchBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  useEffect(() => {
    trackOpportunityViewed(opp.id, opp.title, opp.opportunityType);
  }, [opp.id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('Opportunity link copied to clipboard!');
    }
  };

  const handleSaveOpportunity = async () => {
    if (!isAuthenticated) {
      navigate(`/sign-in?returnTo=/opportunities/${opp.id}`);
      return;
    }

    if (saved) {
      await toggleSave(opp.id);
      toast('Opportunity removed from your saved list.');
    } else {
      await toggleSave(opp.id);
      trackOpportunitySaved(opp.id, opp.title);
      toast('Opportunity saved');
    }
  };

  const handleApplyClick = () => {
    // Record outbound click; clicking apply does NOT submit the application
    trackOpportunityApplied(opp.id, opp.title, opp.opportunityType);
    if (isAuthenticated && !existingApp) {
      addOrUpdateApplication(opp.id, 'PREPARING', 'Opened official application link.');
    }
  };

  const detailContent = (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/opportunities')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#627086] hover:text-[#102641] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Opportunities</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full border border-[#e4eaf0] bg-white text-[#627086] hover:text-[#102641] transition-colors cursor-pointer"
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleSaveOpportunity}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              saved
                ? 'border-[#087b63] bg-[#e3f4ed] text-[#087b63]'
                : 'border-[#e4eaf0] bg-white text-[#627086] hover:text-[#102641]'
            }`}
            title={saved ? 'Saved' : 'Save opportunity'}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="p-6 sm:p-8 space-y-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2 max-w-2xl">
            {/* Source & Verified Date - Exact Copy */}
            <div className="text-[11px] font-semibold text-[#627086]">
              Source: {opp.organization} &bull; Last checked {opp.lastVerifiedAt}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-0.5 rounded-full border ${matchBadgeColor}`}>
                {evaluation.label === 'STRONG_MATCH' && <Target size={12} />}
                <span>{evaluation.displayLabel}</span>
                {evaluation.gatePassed && evaluation.score > 0 && (
                  <span className="font-mono">({evaluation.score}%)</span>
                )}
              </span>
            </div>

            <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#112440] leading-tight">
              {opp.title}
            </h1>

            <p className="text-sm font-bold text-[#087b63]">
              {opp.organization}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            {/* Primary Action Button: Apply on official website (U18: apply - record click only) */}
            {!isClosed ? (
              <a
                href={opp.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${opp.organization || 'official website'} in a new tab`}
                onClick={handleApplyClick}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto justify-center"
                  rightIcon={<ExternalLink size={14} />}
                >
                  Apply on official website
                </Button>
              </a>
            ) : (
              <Button
                variant="secondary"
                size="md"
                disabled
                className="w-full sm:w-auto justify-center opacity-60"
              >
                Applications Closed
              </Button>
            )}

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Save opportunity Button (U18/U19: save / remove) */}
              <Button
                variant="secondary"
                size="md"
                onClick={handleSaveOpportunity}
                className="flex-1 sm:flex-initial justify-center"
                leftIcon={<Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />}
              >
                {saved ? 'Remove from saved' : 'Save opportunity'}
              </Button>
            </div>

            {/* If application is already tracked with a status */}
            {existingApp && (
              <div className="text-[11px] text-[#627086] flex items-center gap-1.5 pt-1">
                <span>Application stage:</span>
                <Link
                  to="/applications"
                  className="font-bold text-[#087b63] hover:underline"
                >
                  {existingApp.status} (View in tracker)
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Closed or Rolling Banner */}
        {isClosed ? (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-[#627086]">
            Applications for this opportunity have closed. You can still review its details.
          </div>
        ) : (
          <div className="text-xs font-semibold text-[#05644f] flex items-center gap-1.5">
            <Clock size={13} />
            <span>Apply by {new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        )}

        {/* Logged Out Save Prompt */}
        {!isAuthenticated && (
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3">
            <span>Sign in with your Sterling account to save this opportunity and track your progress.</span>
            <Link to={`/sign-in?returnTo=/opportunities/${opp.id}`}>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Sign in
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Meta Stats Band */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#edf0f3] text-xs">
          <div>
            <span className="text-[#627086] block text-[11px]">Location</span>
            <strong className="text-[#102641] font-bold flex items-center gap-1 mt-0.5">
              <MapPin size={13} className="text-[#087b63]" />
              <span>{opp.location}</span>
            </strong>
          </div>

          <div>
            <span className="text-[#627086] block text-[11px]">Deadline</span>
            <strong className="text-[#102641] font-bold flex items-center gap-1 mt-0.5">
              <Calendar size={13} className="text-[#087b63]" />
              <span>{new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </strong>
          </div>

          <div>
            <span className="text-[#627086] block text-[11px]">Time Remaining</span>
            <strong className="text-amber-800 font-bold flex items-center gap-1 mt-0.5">
              <Clock size={13} />
              <span>{diffDays > 0 ? `${diffDays} days left` : 'Closed'}</span>
            </strong>
          </div>

          <div>
            <span className="text-[#627086] block text-[11px]">Verified by Sterling</span>
            <strong className="text-[#087b63] font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck size={13} />
              <span>{opp.lastVerifiedAt}</span>
            </strong>
          </div>
        </div>
      </Card>

      {/* Mandatory Disclaimer Notice - Exact Copy */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#627086] leading-relaxed">
        <strong>Notice: </strong>
        This opportunity is advertised by {opp.organization}. Sterling Connect is not responsible for recruitment, selection or award decisions. Review the official requirements and apply directly through the provider.
      </div>

      {/* Dynamic AI-Powered Match Explainer Card */}
      <Card className="p-6 sm:p-7 space-y-5 border-2 border-[#087b63]/25 bg-gradient-to-br from-white via-[#f7faf9] to-[#edf7f3] rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#bddbd1]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#087b63] to-[#0ba384] text-white grid place-items-center shadow-md flex-shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand font-bold text-base sm:text-lg text-[#102641]">
                  Why this opportunity matches your profile
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#087b63] text-white shadow-xs">
                  <Sparkles size={10} /> AI Dynamic Match
                </span>
              </div>
              <p className="text-xs text-[#526078] mt-0.5">
                AI synthesis combining transparent rules matching with your verified credentials.
              </p>
            </div>
          </div>
          {aiMatchData?.matchConfidence && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/70 border border-emerald-300 text-[11px] font-bold text-emerald-900 self-start sm:self-auto">
              <TrendingUp size={13} className="text-emerald-700" />
              <span>{aiMatchData.matchConfidence}</span>
            </div>
          )}
        </div>

        {/* AI Executive Alignment Thesis / Headline */}
        {aiMatchData?.headline ? (
          <div className="p-4 rounded-xl bg-white border border-[#a2d4c5] shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#087b63] flex items-center gap-1.5">
              <Target size={13} />
              <span>Executive Match Thesis</span>
            </div>
            <p className="text-xs sm:text-[13px] font-medium text-[#102641] leading-relaxed">
              {aiMatchData.headline}
            </p>
            {aiMatchData.executiveSummary && (
              <p className="text-xs text-[#526078] leading-relaxed pt-1 whitespace-pre-line border-t border-slate-100">
                {aiMatchData.executiveSummary}
              </p>
            )}
          </div>
        ) : isLoadingAi ? (
          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 flex items-center gap-2 text-xs text-slate-600 animate-pulse">
            <Sparkles size={16} className="text-[#087b63] animate-spin" />
            <span>Analyzing match criteria and profile alignment with AI...</span>
          </div>
        ) : null}

        {/* Competitive Match Pillars (AI Generated from Rules Results) */}
        {aiMatchData?.competitivePillars && aiMatchData.competitivePillars.length > 0 ? (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102641]">
              Competitive Advantage Pillars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {aiMatchData.competitivePillars.map((pillar: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-[#bddbd1] space-y-1.5 shadow-xs hover:border-[#087b63] transition"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-[#087b63] flex items-center gap-1 truncate">
                      <CheckCircle2 size={13} className="flex-shrink-0" />
                      {pillar.title}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {pillar.impactLevel || 'VERIFIED'}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {pillar.matchFactor}
                  </div>
                  <p className="text-[11px] text-[#42516a] leading-relaxed">
                    {pillar.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback Rule Match Factors */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {evaluation.matchedReasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[10px] bg-white border border-[#bddbd1] space-y-1.5 shadow-xs"
              >
                <div className="flex items-center gap-1.5 text-[#087b63] font-bold text-[11px]">
                  <CheckCircle2 size={14} />
                  <span>Verified Match Factor</span>
                </div>
                <p className="text-xs text-[#102641] font-medium leading-relaxed">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Strategic Advice & Application Recommendations */}
        {aiMatchData?.strategicAdvice && aiMatchData.strategicAdvice.length > 0 && (
          <div className="p-4 rounded-xl bg-[#f0f9f6] border border-[#a2d4c5] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[#087b63] font-bold text-xs uppercase tracking-wide">
              <Lightbulb size={15} />
              <span>Strategic Application Guidance</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiMatchData.strategicAdvice.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-[#c1e2d7] text-xs space-y-1 shadow-2xs">
                  <span className="font-bold text-[#102641] block">{item.tip}</span>
                  <p className="text-[11px] text-[#526078] leading-relaxed">{item.actionItem}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Needed Warnings if any */}
        {evaluation.warnings.length > 0 && (
          <div className="space-y-2 pt-1">
            {evaluation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed shadow-xs"
              >
                <AlertTriangle size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-[#edf0f3] flex gap-6 text-sm font-bold">
        {(['overview', 'eligibility', 'application'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition-colors relative cursor-pointer ${
              activeTab === tab
                ? 'text-[#087b63]'
                : 'text-[#627086] hover:text-[#102641]'
            }`}
          >
            <span>{tab === 'application' ? 'Application Process' : tab}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#087b63]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 text-xs text-[#42516a] leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-brand font-bold text-sm text-[#102641]">Overview</h3>
              <p className="text-[13px] text-[#526078] leading-relaxed">{opp.overview}</p>
            </div>

            {isScholarship && opp.scholarshipDetails && (
              <div className="p-4 rounded-xl bg-slate-50 border border-[#e4eaf0] space-y-2">
                <h4 className="font-bold text-[#102641]">Award Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-[#627086]">Funding Coverage: </span>
                    <strong className="text-[#102641]">
                      {opp.scholarshipDetails.fundingLevel === 'FULLY_FUNDED'
                        ? '100% Fully Funded (Tuition, Stipend, Flights)'
                        : 'Partial Tuition Waiver'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Target Program Year: </span>
                    <strong className="text-[#102641]">{opp.scholarshipDetails.programStartYear}</strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Eligible Degree Levels: </span>
                    <strong className="text-[#102641]">{opp.scholarshipDetails.studyLevels.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Eligible Academic Fields: </span>
                    <strong className="text-[#102641]">{opp.scholarshipDetails.eligibleFields.join(', ')}</strong>
                  </div>
                </div>
              </div>
            )}

            {!isScholarship && opp.employmentDetails && (
              <div className="p-4 rounded-xl bg-slate-50 border border-[#e4eaf0] space-y-2">
                <h4 className="font-bold text-[#102641]">Role Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-[#627086]">Sector: </span>
                    <strong className="text-[#102641]">{opp.employmentDetails.sector}</strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Function: </span>
                    <strong className="text-[#102641]">{opp.employmentDetails.function}</strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Work Arrangement: </span>
                    <strong className="text-[#102641]">{opp.employmentDetails.workArrangement}</strong>
                  </div>
                  <div>
                    <span className="text-[#627086]">Compensation: </span>
                    <strong className="text-[#087b63]">{opp.employmentDetails.compensationRange || 'Market competitive'}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="space-y-4 text-xs text-[#526078] leading-relaxed">
            <h3 className="font-brand font-bold text-sm text-[#102641]">Stated Eligibility Criteria</h3>
            <ul className="space-y-2.5">
              {opp.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-[#e4eaf0]">
                  <CheckCircle2 size={16} className="text-[#087b63] flex-shrink-0 mt-0.5" />
                  <span className="text-[#102641] font-medium leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'application' && (
          <div className="space-y-4 text-xs text-[#526078] leading-relaxed">
            <h3 className="font-brand font-bold text-sm text-[#102641]">Official Application Instructions</h3>
            <p>
              Sterling Connect operates as an opportunity navigation and preparation system. Official submissions must be made directly on the provider&apos;s external portal before the stated deadline.
            </p>

            <div className="p-4 rounded-xl bg-[#f0f8f5] border border-[#bddbd1] space-y-3">
              <strong className="block text-[#05644f] font-bold text-sm">Next Steps:</strong>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#05644f]">
                <li>Review all provider eligibility criteria on the official website.</li>
                <li>Prepare and verify your transcripts, essays, or CV to meet provider guidelines.</li>
                <li>Submit your application on the official site prior to <strong>{opp.deadline}</strong>.</li>
                <li>Return to Sterling Connect to log your application status in <strong>My Applications</strong>.</li>
              </ol>

              <div className="pt-2">
                <a
                  href={opp.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${opp.organization || 'official website'} in a new tab`}
                >
                  <Button variant="primary" size="md" rightIcon={<ExternalLink size={14} />}>
                    Apply on official website
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24 sm:pb-10">
      {detailContent}

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e4eaf0] p-3 z-30 shadow-lg flex items-center gap-2">
        <button
          type="button"
          onClick={handleSaveOpportunity}
          className={`h-11 px-3.5 rounded-xl border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
            saved
              ? 'border-[#087b63] bg-[#e3f4ed] text-[#087b63]'
              : 'border-[#e4eaf0] bg-white text-[#627086]'
          }`}
          aria-label={saved ? 'Saved' : 'Save opportunity'}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {!isClosed ? (
          <a
            href={opp.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${opp.organization || 'official website'} in a new tab`}
            onClick={handleApplyClick}
            className="flex-1"
          >
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center h-11 text-xs font-bold"
              rightIcon={<ExternalLink size={14} />}
            >
              Apply on official website
            </Button>
          </a>
        ) : (
          <Button
            variant="secondary"
            size="md"
            disabled
            className="flex-1 justify-center h-11 opacity-60 text-xs font-bold"
          >
            Application deadline passed
          </Button>
        )}
      </div>

      {/* Pop-up modal asking user if they have applied for easy tracking */}
      <HaveYouAppliedModal
        isOpen={showAppliedPrompt}
        onClose={handleDismissAppliedPrompt}
        onConfirmApplied={handleConfirmApplied}
        opportunityTitle={opp.title}
        organization={opp.organization}
        deadline={opp.deadline ? new Date(opp.deadline).toLocaleDateString() : undefined}
        daysLeft={diffDays}
      />
    </div>
  );
};
