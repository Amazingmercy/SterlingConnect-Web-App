import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Clock,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Target,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const CATEGORIES = [
  'Career Development & Employability',
  'Scholarships & Educational Advancement',
  'Leadership & People Management',
  'Project & Programme Management',
  'Research, Data & Evidence',
  'Monitoring, Evaluation & Learning',
  'Communication & Professional Effectiveness',
  'Entrepreneurship & Business Development',
  'Digital Skills, AI & Productivity',
  'Organizational Development & Strategy',
];

export const AssessmentGatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isCompleted,
    hasUnsavedProgress: rawHasUnsavedProgress,
    answeredCount,
    totalQuestions,
    resetAssessment,
  } = useAssessment();

  const isUserCompleted = Boolean(user?.hasCompletedAssessment && isCompleted);
  const hasUnsavedProgress = rawHasUnsavedProgress && !isUserCompleted;

  const isScholarship = user?.pathway === 'Education & Scholarships';
  const pathwayTitle = isScholarship ? 'Scholarship readiness assessment' : 'Career readiness assessment';
  const pathwayBody = isScholarship
    ? 'Reflect on your study goals, search habits, eligibility awareness, academic preparation, documents, personal statement, references, planning and interviews.'
    : 'Reflect on your career direction, profile, search habits, applications, communication, interviews, workplace preparation and core employability skills.';

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Main Diagnostic Gate Card */}
      <div className="w-full bg-white border border-[#e4eaf0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Headings with Immediate CTA - No Scrolling Needed */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#edf0f3]">
          <div className="space-y-2">
            <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#102641] tracking-tight">
              {pathwayTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#526078] leading-relaxed max-w-xl">
              {pathwayBody}
            </p>
            <p className="text-xs text-[#087b63] font-semibold">
              Choose the answer that best describes where you are today. Honest answers make your next steps more useful.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/assessment/questions')}
              className="w-full sm:w-auto px-6 py-3 font-bold shadow-sm"
              rightIcon={<ArrowRight size={16} />}
            >
              {hasUnsavedProgress ? 'Continue assessment' : isUserCompleted ? 'Retake assessment' : 'Start assessment'}
            </Button>
          </div>
        </div>

        {/* Diagnostic Key Specs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] text-center space-y-1">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 grid place-items-center mx-auto mb-1">
              <ClipboardCheck size={18} />
            </div>
            <strong className="block text-xs font-bold text-[#102641]">50 Statements</strong>
            <small className="block text-[11px] text-[#627086]">5 statements per category</small>
          </div>

          <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] text-center space-y-1">
            <div className="w-9 h-9 rounded-full bg-[#e3f4ed] text-[#087b63] grid place-items-center mx-auto mb-1">
              <Clock size={18} />
            </div>
            <strong className="block text-xs font-bold text-[#102641]">10 – 15 Minutes</strong>
            <small className="block text-[11px] text-[#627086]">Self-paced, autosaved</small>
          </div>

          <div className="p-4 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] text-center space-y-1">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 grid place-items-center mx-auto mb-1">
              <BookOpen size={18} />
            </div>
            <strong className="block text-xs font-bold text-[#102641]">Academy Linked</strong>
            <small className="block text-[11px] text-[#627086]">Direct course recommendations</small>
          </div>
        </div>

        {/* 10 Evaluated Domains Preview */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-[#102641] block uppercase tracking-wider">
            10 Evaluated Competency Domains:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#42516a]">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={cat}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#f8fafb] border border-slate-100"
              >
                <span className="w-5 h-5 rounded-full bg-white border border-[#e4eaf0] text-[10px] font-extrabold grid place-items-center flex-shrink-0 text-[#102641]">
                  {idx + 1}
                </span>
                <span className="truncate font-semibold">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unsaved Progress Banner */}
        {hasUnsavedProgress && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900">
            <div className="text-xs">
              <strong className="font-bold">Progress detected: </strong>
              <span>
                You have answered {answeredCount} of {totalQuestions} statements.
              </span>
            </div>
            <button
              onClick={resetAssessment}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Start over</span>
            </button>
          </div>
        )}

        {/* Completed Banner */}
        {isUserCompleted && (
          <div className="p-4 rounded-xl bg-[#e3f4ed] border border-[#bddbd1] flex items-center justify-between gap-3 text-[#05644f]">
            <div className="text-xs">
              <strong className="font-bold">Assessment Completed: </strong>
              <span>You have already completed your diagnostic evaluation.</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/assessment/results')}
            >
              View Results
            </Button>
          </div>
        )}

        {/* Policy & Integrity Notice - Exact U11 Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-[#526078] leading-relaxed">
          <ShieldCheck size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="block font-medium text-[#102641]">
              This is a development guide, not a pass or fail decision. Your result does not confirm eligibility or predict selection.
            </span>
            <span className="block text-[11px] text-[#627086]">
              You can save your progress and return later.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 space-y-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/assessment/questions')}
            className="w-full justify-center text-sm py-4 font-bold"
            rightIcon={<ArrowRight size={16} />}
          >
            {hasUnsavedProgress ? 'Continue assessment' : isUserCompleted ? 'Retake assessment' : 'Start assessment'}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => navigate('/opportunities')}
              className="text-xs font-semibold text-[#627086] hover:text-[#087b63] transition-colors"
            >
              Explore opportunities first
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
