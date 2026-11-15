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
} from 'lucide-react';
import { useOpportunities } from '../../context/OpportunityContext';
import { useApplications } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { NotFoundPage } from '../../pages/NotFoundPage';
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

  const opp = opportunities.find((o) => o.id === id);

  if (!opp) {
    return <NotFoundPage />;
  }

  const saved = isSaved(opp.id);
  const evaluation = getEvaluation(opp);
  const existingApp = getApplicationByOppId(opp.id);

  const deadlineDate = new Date(opp.deadline);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
      navigate(`/register?returnTo=/opportunities/${opp.id}`);
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

              <span className="text-[11px] font-bold text-[#627086] bg-slate-100 px-2.5 py-0.5 rounded">
                Ref: {opp.referenceCode}
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
            <span>Create an account to save this opportunity and track your progress.</span>
            <Link to={`/register?returnTo=/opportunities/${opp.id}`}>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Create account
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

      {/* Transparent Match Explainer Card */}
      <Card className="p-6 sm:p-7 space-y-4 border-2 border-[#087b63]/20 bg-gradient-to-br from-white to-[#f5faf8] rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#e3f4ed] text-[#087b63] grid place-items-center flex-shrink-0">
            <Target size={18} />
          </div>
          <div>
            <h3 className="font-brand font-bold text-base text-[#102641]">
              Why this opportunity matches your profile
            </h3>
            <p className="text-xs text-[#627086]">
              Calculated using transparent rules-based matching against your profile attributes.
            </p>
          </div>
        </div>

        {/* Top Verified Match Reasons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

        {/* Action Needed Warnings if any */}
        {evaluation.warnings.length > 0 && (
          <div className="space-y-2 pt-2">
            {evaluation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed"
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
    </div>
  );
};
