import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { ShieldCheck, Award, Compass, TrendingUp } from 'lucide-react';

export const ProfileCompletionCard: React.FC = () => {
  const { profile } = useProfile();
  const { completionPercentage } = profile;

  let strengthLabel = 'Building Profile';
  let badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
  let progressColor = 'from-amber-500 to-amber-600';
  let Icon = TrendingUp;

  if (completionPercentage >= 80) {
    strengthLabel = 'Strong Profile Match Ready';
    badgeColor = 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';
    progressColor = 'from-[#087b63] to-[#0a9477]';
    Icon = ShieldCheck;
  } else if (completionPercentage >= 50) {
    strengthLabel = 'Progressing Well';
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    progressColor = 'from-blue-600 to-blue-700';
    Icon = Award;
  }

  return (
    <div className="bg-white border border-[#e4eaf0] rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#627086]">
          <Compass size={14} className="text-[#087b63]" />
          <span>Profile Readiness</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
          <Icon size={12} />
          <span>{strengthLabel}</span>
        </span>
      </div>

      {/* Main Percentage Display & Progress Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
              {completionPercentage}%
            </span>
            <span className="text-xs font-bold text-[#627086] uppercase tracking-wider">
              Complete
            </span>
          </div>
          <span className="text-[11px] text-[#627086] font-medium">
            {completionPercentage >= 80 ? 'Target achieved' : `${100 - completionPercentage}% remaining`}
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700 ease-out shadow-xs`}
            style={{ width: `${Math.max(5, completionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Explanatory Note */}
      <p className="text-[11px] text-[#627086] leading-relaxed pt-1 border-t border-slate-100">
        A comprehensive profile increases matching accuracy and unlocks high-relevance opportunity notifications.
      </p>
    </div>
  );
};
