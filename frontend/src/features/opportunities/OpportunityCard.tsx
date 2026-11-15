import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BriefcaseBusiness,
  MapPin,
  Calendar,
  Bookmark,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
} from 'lucide-react';
import type { Opportunity } from '../../types/opportunity';
import { useOpportunities } from '../../context/OpportunityContext';
import { useApplications } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';

export const OpportunityCard: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
  const { toggleSave, isSaved, getEvaluation } = useOpportunities();
  const { addOrUpdateApplication, removeApplication, getApplicationByOppId } = useApplications();
  const { isAuthenticated } = useAuth();
  const saved = isSaved(opportunity.id);
  const evaluation = getEvaluation(opportunity);

  // Calculate days remaining until deadline
  const deadlineDate = new Date(opportunity.deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isScholarship = opportunity.opportunityType === 'SCHOLARSHIP';

  let matchBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  if (evaluation.displayColor === 'emerald') {
    matchBadgeColor = 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';
  } else if (evaluation.displayColor === 'amber') {
    matchBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (evaluation.displayColor === 'slate') {
    matchBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <Card hoverEffect className="flex flex-col justify-between p-5 space-y-4 border border-[#e4eaf0] bg-white rounded-[12px] relative group">
      <div className="space-y-3">
        {/* Top Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2">
          {/* Match Pill (Personalised for logged-in users; Public category tag for visitors) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAuthenticated ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${matchBadgeColor}`}>
                {evaluation.label === 'STRONG_MATCH' && <Target size={11} />}
                <span>{evaluation.displayLabel}</span>
                {evaluation.gatePassed && evaluation.score > 0 && (
                  <span className="font-mono">({evaluation.score}%)</span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                {isScholarship ? 'Scholarship' : 'Career & Employment'}
              </span>
            )}

            {opportunity.isNewThisWeek && (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                New
              </span>
            )}
          </div>

          {/* Bookmark Button (U19) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(opportunity.id);
            }}
            className={`w-8 h-8 rounded-full border transition-colors grid place-items-center cursor-pointer ${
              saved
                ? 'border-[#087b63] bg-[#e3f4ed] text-[#087b63]'
                : 'border-[#e4eaf0] bg-white text-[#627086] hover:text-[#102641] hover:bg-slate-50'
            }`}
            aria-label={saved ? 'Remove from saved' : 'Save opportunity'}
            title={saved ? 'Saved in Saved Opportunities' : 'Save opportunity'}
          >
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Opportunity Title & Organization */}
        <div>
          <Link
            to={`/opportunities/${opportunity.id}`}
            className="font-brand font-bold text-[15px] text-[#102641] group-hover:text-[#087b63] transition-colors leading-snug line-clamp-2"
          >
            {opportunity.title}
          </Link>
          <p className="text-[12px] font-semibold text-[#087b63] mt-0.5">
            {opportunity.organization}
          </p>
        </div>

        {/* Key Attributes Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-[#526078]">
          <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2.5 py-1 rounded-[6px] border border-[#e4eaf0]">
            <MapPin size={12} className="text-[#627086]" />
            <span>{opportunity.location || opportunity.country}</span>
          </span>

          {isScholarship && opportunity.scholarshipDetails && (
            <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2.5 py-1 rounded-[6px] border border-[#e4eaf0]">
              <GraduationCap size={12} className="text-[#627086]" />
              <span>
                {opportunity.scholarshipDetails.fundingLevel === 'FULLY_FUNDED'
                  ? 'Fully Funded'
                  : 'Partial Tuition'}
              </span>
            </span>
          )}

          {!isScholarship && opportunity.employmentDetails && (
            <span className="inline-flex items-center gap-1 bg-[#f8fafb] px-2.5 py-1 rounded-[6px] border border-[#e4eaf0]">
              <BriefcaseBusiness size={12} className="text-[#627086]" />
              <span>{opportunity.employmentDetails.subType}</span>
            </span>
          )}
        </div>

        {/* Top Matched Reason preview (Only for authenticated candidate profile matching) */}
        {isAuthenticated && evaluation.matchedReasons.length > 0 && (
          <p className="text-[11px] text-[#05644f] bg-[#f0f8f5] p-2 rounded-[6px] flex items-center gap-1.5 border border-[#bddbd1]">
            <CheckCircle2 size={13} className="text-[#087b63] flex-shrink-0" />
            <span className="truncate">{evaluation.matchedReasons[0]}</span>
          </p>
        )}
      </div>

      {/* Footer Meta, Days Left & CTA */}
      <div className="pt-3 border-t border-[#edf0f3] flex items-center justify-between text-[11px] text-[#627086]">
        <div className="flex items-center gap-1 font-medium">
          <Calendar size={13} />
          <span>
            Deadline: {new Date(opportunity.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <Link
          to={`/opportunities/${opportunity.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-bold text-[#087b63] hover:text-[#05644f] flex items-center gap-1 transition-colors text-xs"
        >
          <span>View opportunity</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </Card>
  );
};
