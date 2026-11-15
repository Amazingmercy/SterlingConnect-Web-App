import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  BriefcaseBusiness,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { PathwayType } from '../../types/auth';
import { trackPathwaySelected } from '../../utils/analytics';

export const GOAL_OPTIONS = [
  { key: 'campus_to_career', label: 'Move from study into work' },
  { key: 'get_hired', label: 'Find a job or internship' },
  { key: 'succeed_at_work', label: 'Succeed in my current role' },
  { key: 'grow_lead', label: 'Grow my career and leadership skills' },
  { key: 'become_manager', label: 'Prepare for management or lead a team' },
  { key: 'build_business', label: 'Start or grow a business' },
  { key: 'prepare_future', label: 'Prepare for changes in the world of work' },
  { key: 'personal_finance', label: 'Manage my personal finances' },
  { key: 'not_sure', label: 'Not sure yet' },
] as const;

export const CAREER_STAGE_OPTIONS = [
  { key: 'student', label: 'Student' },
  { key: 'graduate', label: 'Recent graduate' },
  { key: 'first_job', label: 'Starting my first job' },
  { key: 'early_career', label: 'Early-career professional' },
  { key: 'experienced', label: 'Experienced professional' },
  { key: 'new_manager', label: 'New manager' },
  { key: 'manager', label: 'Established manager' },
  { key: 'entrepreneur', label: 'Freelancer or entrepreneur' },
] as const;

export const PathwaySelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setPathway } = useAuth();
  const { toast } = useToast();

  // Multi-select pathway state: user can choose one or both
  const [isCareerSelected, setIsCareerSelected] = useState<boolean>(() => {
    if (!user?.pathway) return true;
    return user.pathway === 'Career & Employment' || user.pathway === 'Both Pathways';
  });

  const [isScholarshipSelected, setIsScholarshipSelected] = useState<boolean>(() => {
    if (!user?.pathway) return false;
    return user.pathway === 'Education & Scholarships' || user.pathway === 'Both Pathways';
  });

  // Primary pathway starting focus when both are selected
  const [primaryChoice, setPrimaryChoice] = useState<'Career & Employment' | 'Education & Scholarships'>(
    user?.primaryGoal === 'Education & Scholarships' ? 'Education & Scholarships' : 'Career & Employment'
  );

  // Goal & Stage for Career & Employment
  const [selectedGoal, setSelectedGoal] = useState<string>('campus_to_career');
  const [selectedStage, setSelectedStage] = useState<string>('graduate');

  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isBothSelected = isCareerSelected && isScholarshipSelected;

  const handleContinue = async () => {
    setValidationError('');

    // Validation: Choose at least one pathway to continue.
    if (!isCareerSelected && !isScholarshipSelected) {
      setValidationError('Choose at least one pathway to continue.');
      return;
    }

    setIsLoading(true);
    try {
      let finalPathway: PathwayType;
      let finalPrimary: PathwayType | undefined = undefined;

      if (isBothSelected) {
        finalPathway = 'Both Pathways';
        finalPrimary = primaryChoice;
      } else if (isCareerSelected) {
        finalPathway = 'Career & Employment';
      } else {
        finalPathway = 'Education & Scholarships';
      }

      // If "not_sure" is selected, leave learning_goal unset per specification
      const goalToSave = isCareerSelected && selectedGoal !== 'not_sure' ? selectedGoal : undefined;
      const stageToSave = isCareerSelected ? selectedStage : undefined;

      await setPathway(finalPathway, finalPrimary, goalToSave, stageToSave);
      trackPathwaySelected(finalPathway, goalToSave);
      toast('Pathway preferences updated.');
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-2xl bg-white border border-[#e2e7f0] rounded-2xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-6">
        {/* Headings - Exact Copy */}
        <div className="space-y-1.5 text-left">
          <h1 className="font-brand font-extrabold text-2xl sm:text-3xl tracking-tight text-[#112440]">
            What are you working towards?
          </h1>
          <p className="text-sm text-[#526078] leading-relaxed">
            Choose one or both pathways. You can change this later.
          </p>
        </div>

        {validationError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Multi-Select Pathway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Career & Employment */}
          <div
            onClick={() => {
              setIsCareerSelected(!isCareerSelected);
              if (validationError) setValidationError('');
            }}
            className={`flex flex-col text-left p-5 rounded-xl border-2 transition-all duration-200 select-none cursor-pointer group ${
              isCareerSelected
                ? 'border-[#087b63] bg-[#f0f8f5] shadow-[0_0_0_1px_#087b63_inset]'
                : 'border-[#e4eaf0] bg-white hover:border-[#b8dcd0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#fff0e4] text-[#b66b25] grid place-items-center">
                <BriefcaseBusiness size={22} />
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isCareerSelected
                    ? 'border-[#087b63] bg-[#087b63] text-white'
                    : 'border-[#cbd5e1] bg-white'
                }`}
              >
                {isCareerSelected && <Check size={13} strokeWidth={3} />}
              </div>
            </div>

            <h3 className="text-base font-bold text-[#102641] leading-tight mb-1.5">
              Career &amp; Employment
            </h3>

            <p className="text-xs text-[#526078] leading-relaxed">
              Prepare for jobs, internships, graduate programmes and fellowships with a clearer profile and practical next steps.
            </p>
          </div>

          {/* Card 2: Education & Scholarships */}
          <div
            onClick={() => {
              setIsScholarshipSelected(!isScholarshipSelected);
              if (validationError) setValidationError('');
            }}
            className={`flex flex-col text-left p-5 rounded-xl border-2 transition-all duration-200 select-none cursor-pointer group ${
              isScholarshipSelected
                ? 'border-[#087b63] bg-[#f0f8f5] shadow-[0_0_0_1px_#087b63_inset]'
                : 'border-[#e4eaf0] bg-white hover:border-[#b8dcd0] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#e3f5ed] text-[#0b7961] grid place-items-center">
                <GraduationCap size={22} />
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isScholarshipSelected
                    ? 'border-[#087b63] bg-[#087b63] text-white'
                    : 'border-[#cbd5e1] bg-white'
                }`}
              >
                {isScholarshipSelected && <Check size={13} strokeWidth={3} />}
              </div>
            </div>

            <h3 className="text-base font-bold text-[#102641] leading-tight mb-1.5">
              Education &amp; Scholarships
            </h3>

            <p className="text-xs text-[#526078] leading-relaxed">
              Clarify your study goals, strengthen your application preparation and explore scholarships that may fit your profile.
            </p>
          </div>
        </div>

        {/* Primary Pathway Selector (When both are selected) */}
        {isBothSelected && (
          <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] space-y-2.5 animate-in fade-in duration-200 text-left">
            <label className="text-xs font-bold text-[#102641]">
              Which pathway would you like to start with?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPrimaryChoice('Career & Employment')}
                className={`p-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-left flex items-center justify-between ${
                  primaryChoice === 'Career & Employment'
                    ? 'bg-[#087b63] text-white border-[#087b63]'
                    : 'bg-white text-[#102641] border-[#e4eaf0] hover:bg-slate-50'
                }`}
              >
                <span>Career &amp; Employment</span>
                {primaryChoice === 'Career & Employment' && <Check size={14} />}
              </button>

              <button
                type="button"
                onClick={() => setPrimaryChoice('Education & Scholarships')}
                className={`p-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-left flex items-center justify-between ${
                  primaryChoice === 'Education & Scholarships'
                    ? 'bg-[#087b63] text-white border-[#087b63]'
                    : 'bg-white text-[#102641] border-[#e4eaf0] hover:bg-slate-50'
                }`}
              >
                <span>Education &amp; Scholarships</span>
                {primaryChoice === 'Education & Scholarships' && <Check size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Career & Employment Goal & Stage Details (When Career is selected) */}
        {isCareerSelected && (
          <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] space-y-4 animate-in fade-in duration-200 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#102641] block">
                What is your main goal right now?
              </label>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-[#e4eaf0] bg-white text-[#102641] focus:outline-none focus:ring-2 focus:ring-[#90cfc0]"
              >
                {GOAL_OPTIONS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#102641] block">
                Which stage best describes you?
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-[#e4eaf0] bg-white text-[#102641] focus:outline-none focus:ring-2 focus:ring-[#90cfc0]"
              >
                {CAREER_STAGE_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Button - Exact Copy */}
        <div className="pt-2">
          <Button
            onClick={handleContinue}
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full justify-center text-[13px] py-3.5 font-bold"
            rightIcon={!isLoading ? <ArrowRight size={14} /> : undefined}
          >
            Continue to my profile
          </Button>
        </div>
      </div>
    </div>
  );
};
