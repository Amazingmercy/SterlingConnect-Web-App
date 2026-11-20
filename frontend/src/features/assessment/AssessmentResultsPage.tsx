import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const AssessmentResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result, resetAssessment } = useAssessment();
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);

  const hasResults = Boolean(user?.hasCompletedAssessment && result);

  if (!hasResults || !result) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4 p-6 bg-white rounded-xl border border-[#e4eaf0]">
        <h2 className="font-brand font-bold text-lg text-[#102641]">No Assessment Results Found</h2>
        <p className="text-xs text-[#627086]">
          You haven&apos;t completed the readiness diagnostic yet.
        </p>
        <Link to="/assessment">
          <Button variant="primary">Start Assessment</Button>
        </Link>
      </div>
    );
  }

  const { overallScore, categoryResults, priorityCategories } = result;

  const isScholarship = user?.pathway === 'Education & Scholarships';
  const pathwayReadinessName = isScholarship ? 'scholarship readiness' : 'career readiness';
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedScore = (Math.round(overallScore * 10) / 10).toFixed(1);

  // Exact U14 Bands & Interpretations
  let bandLabel = 'Developing';
  let bandInterpretation = 'Some foundations are in place. Focus on the gaps that matter most to your current goal.';
  let bandColor = 'bg-blue-50 text-blue-700 border-blue-200';

  if (overallScore >= 80) {
    bandLabel = 'Strong Readiness';
    bandInterpretation = 'Your answers show strong preparation indicators. Continue checking each opportunity’s requirements and tailoring your approach.';
    bandColor = 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';
  } else if (overallScore >= 60) {
    bandLabel = 'Progressing';
    bandInterpretation = 'Many preparation habits are in place. Strengthen the areas that need more attention and keep applying what you learn.';
    bandColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (overallScore >= 40) {
    bandLabel = 'Developing';
    bandInterpretation = 'Some foundations are in place. Focus on the gaps that matter most to your current goal.';
    bandColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else {
    bandLabel = 'Building Foundations';
    bandInterpretation = 'Several areas need focused preparation. Start with a small number of practical actions and build from there.';
    bandColor = 'bg-red-50 text-red-800 border-red-200';
  }

  // Dimension Badge helper per U14
  const getDimensionBadge = (score: number) => {
    if (score < 40) {
      return { label: 'Priority to strengthen', color: 'bg-red-50 text-red-800 border-red-200' };
    }
    if (score < 60) {
      return { label: 'Area to develop', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return null;
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#edf0f3] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1] text-[11px] font-bold mb-2">
            <Award size={14} />
            <span>Completed {completedDate}</span>
          </div>
          <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#112440] tracking-tight capitalize">
            Your {pathwayReadinessName} results
          </h1>
          <p className="text-xs text-[#627086] mt-1">
            Overall readiness: {formattedScore}%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRetakeModalOpen(true)}
            className="text-[12px] font-bold text-[#627086] hover:text-[#102641] flex items-center gap-1 px-3 py-2 rounded-lg border border-[#e4eaf0] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Retake assessment</span>
          </button>

          <Link to="/recommendations">
            <Button variant="primary" rightIcon={<ArrowRight size={14} />}>
              View recommendations
            </Button>
          </Link>
        </div>

        <ConfirmationModal
          isOpen={isRetakeModalOpen}
          onClose={() => setIsRetakeModalOpen(false)}
          onConfirm={() => {
            resetAssessment();
            navigate('/assessment/questions');
          }}
          title="Retake assessment?"
          description="Create new attempt; preserve history. Previous responses will be archived and a new assessment attempt will begin."
          confirmLabel="Retake assessment"
          cancelLabel="Cancel"
          variant="warning"
          icon="reset"
        />
      </div>

      {/* Hero Overview Card: Overall Score & Priority Areas Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Score Gauge */}
        <Card className="lg:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-white to-[#f5faf8]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#627086]">
            Overall readiness: {formattedScore}%
          </h3>

          {/* Score Ring */}
          <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-[#f0f8f5] border-8 border-[#087b63]/20 shadow-xs">
            <div className="text-center">
              <span className="font-brand font-extrabold text-3xl sm:text-4xl text-[#102641] block">
                {formattedScore}%
              </span>
              <span className="text-[10px] font-bold text-[#627086] uppercase tracking-wide">
                Readiness Index
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${bandColor}`}>
              {bandLabel}
            </span>
            <p className="text-[11px] text-[#526078] max-w-xs pt-1 leading-relaxed">
              {bandInterpretation}
            </p>
          </div>
        </Card>

        {/* Right: Assessment Scope & Guidance + Key Actions */}
        <Card className="lg:col-span-7 p-6 sm:p-8 space-y-5 border border-[#e4eaf0] bg-white flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                <AlertTriangle size={17} className="text-amber-600" />
              </div>
              <h3 className="font-brand font-extrabold text-base sm:text-lg text-[#102641] tracking-tight">
                Assessment Scope &amp; Guidance
              </h3>
            </div>
            <p className="text-xs sm:text-[13px] text-[#526078] leading-relaxed">
              Your result reflects your answers about preparation. It does not confirm eligibility or guarantee a job, scholarship or selection outcome.
            </p>
          </div>

          <div className="pt-4 border-t border-[#edf0f3] flex flex-wrap items-center gap-3">
            <Link to="/recommendations" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto font-bold justify-center shadow-xs" rightIcon={<ArrowRight size={14} />}>
                View recommendations
              </Button>
            </Link>
            <Link to="/opportunities" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" className="w-full sm:w-auto font-bold justify-center">
                Explore opportunities
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Your readiness by area */}
      <div className="space-y-4">
        <div>
          <h2 className="font-brand font-bold text-lg text-[#102641]">
            Your readiness by area
          </h2>
          <p className="text-xs text-[#627086]">
            Scores and development status across evaluated capability domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryResults.map((cat) => {
            const badge = getDimensionBadge(cat.score);
            const formattedCatScore = (Math.round(cat.score * 10) / 10).toFixed(1);

            return (
              <div
                key={cat.categoryId}
                className="p-4 rounded-[12px] border border-[#e4eaf0] bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {badge && (
                      <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                    <h4 className="text-[13px] font-bold text-[#102641] leading-tight">
                      {cat.categoryTitle}: {formattedCatScore}%
                    </h4>
                  </div>

                  <span className="font-brand font-extrabold text-[15px] text-[#102641]">
                    {formattedCatScore}%
                  </span>
                </div>

                {/* Score bar */}
                <div className="w-full bg-[#e4eaf0] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.score >= 60 ? 'bg-[#087b63]' : cat.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(cat.score, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#f8fafb] border border-[#e4eaf0] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="font-brand font-extrabold text-base text-[#102641] tracking-tight">
            Ready to act on your results?
          </h4>
          <p className="text-[11px] text-[#627086] truncate whitespace-nowrap overflow-hidden text-ellipsis block">
            Your result reflects your answers about preparation. It does not confirm eligibility or guarantee a job, scholarship or selection outcome.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link to="/recommendations" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto font-bold justify-center shadow-xs" rightIcon={<ArrowRight size={14} />}>
              View recommendations
            </Button>
          </Link>
          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto font-bold justify-center">
              Explore opportunities
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
