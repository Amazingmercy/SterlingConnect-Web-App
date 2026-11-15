import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save, AlertCircle } from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useToast } from '../../context/ToastContext';
import { ASSESSMENT_QUESTIONS, RESPONSE_OPTIONS } from './data/questions';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { trackAssessmentStarted, trackAssessmentCompleted } from '../../utils/analytics';

export const AssessmentQuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    answers,
    currentIndex,
    setCurrentIndex,
    setAnswer,
    submitAssessment,
    totalQuestions,
  } = useAssessment();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];
  const currentAnswer = answers[currentQ.id];

  useEffect(() => {
    trackAssessmentStarted('Readiness Diagnostic');
  }, []);

  // Calculate percentage of questions answered
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Keyboard shortcut listener (keys 1-5 to select, left/right arrows for prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const val = parseInt(e.key, 10);
        handleSelectOption(val);
      } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && currentAnswer) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentAnswer, currentQ.id]);

  const handleSelectOption = (value: number) => {
    setAnswer(currentQ.id, value);
    setValidationError('');
  };

  const handleNext = () => {
    if (!currentAnswer) {
      setValidationError('Choose an answer before continuing.');
      return;
    }
    setValidationError('');
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    setValidationError('');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setShowUnsavedModal(true);
    }
  };

  const handleReviewAndSubmit = () => {
    if (!currentAnswer) {
      setValidationError('Choose an answer before continuing.');
      return;
    }
    setSubmissionError('');
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmissionError('');
    // Check if any question remains unanswered
    const unanswered = ASSESSMENT_QUESTIONS.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const firstUnansweredIndex = ASSESSMENT_QUESTIONS.findIndex((q) => q.id === unanswered[0].id);
      setCurrentIndex(firstUnansweredIndex);
      setShowReviewModal(false);
      setValidationError('Choose an answer before continuing.');
      toast(`You have ${unanswered.length} unanswered questions. Complete them before submitting.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssessment();
      trackAssessmentCompleted('Readiness Diagnostic', 100, 'SUBMITTED');
      setShowReviewModal(false);
      toast('Your assessment progress has been saved.');
      navigate('/assessment/results');
    } catch {
      setSubmissionError('We couldn’t complete your assessment submission. Your saved answers are still available. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = () => {
    if (!navigator.onLine) {
      toast('You appear to be offline. Reconnect before saving your changes.', 'error');
      return;
    }
    toast('Your assessment progress has been saved.');
    navigate('/assessment');
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-4xl bg-white border border-[#e2e7f0] rounded-2xl p-5 sm:p-6 shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-4">
        {/* Top Header: Category Pill & Question Counter */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="inline-block text-[11px] font-bold text-[#087b63] bg-[#e3f4ed] border border-[#bddbd1] px-2.5 py-0.5 rounded-full">
              {currentQ.categoryTitle}
            </span>
            <span className="text-[#627086] font-medium">
              Question <strong className="text-[#102641] font-bold">{currentIndex + 1}</strong> of {totalQuestions} &bull; {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#e4eaf0] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#087b63] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Statement Box */}
        <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-50 to-[#f0f8f5] border border-[#e4eaf0] min-h-[90px] flex items-center justify-center text-center">
          <h2 className="font-brand font-extrabold text-base sm:text-xl text-[#112440] leading-snug max-w-2xl">
            &ldquo;{currentQ.statement}&rdquo;
          </h2>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 5 Response Option Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#102641]">
              Choose one answer.
            </label>
            <span className="hidden sm:inline text-[11px] text-[#627086]">
              Press keys 1-5 or click to select
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {RESPONSE_OPTIONS.map((opt) => {
              const isSelected = currentAnswer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  className={`flex flex-col justify-between p-3 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer group ${
                    isSelected
                      ? 'border-[#087b63] bg-[#f0f8f5] shadow-xs'
                      : 'border-[#e4eaf0] bg-white hover:border-[#b8dcd0] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full pb-1">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-extrabold grid place-items-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#087b63] text-white shadow-xs'
                          : 'bg-slate-100 text-[#627086] border border-slate-200 group-hover:bg-slate-200'
                      }`}
                    >
                      {opt.value}
                    </span>

                    {isSelected && (
                      <span className="text-[#087b63]">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>

                  <div className="pt-1 space-y-0.5">
                    <strong
                      className={`block text-xs font-bold ${
                        isSelected ? 'text-[#087b63]' : 'text-[#102641]'
                      }`}
                    >
                      {opt.label}
                    </strong>
                    <span className="block text-[10px] text-[#627086] leading-tight">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls: Always Visible without Scrolling */}
        <div className="pt-3 border-t border-[#edf0f3] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevious}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#627086] hover:text-[#102641] border border-[#e4eaf0] bg-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Previous question</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndExit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#087b63] hover:bg-[#e3f4ed] transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>Save and exit</span>
            </button>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end">
            {currentIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                className="w-full sm:w-auto justify-center px-6 py-2 text-xs font-bold"
                rightIcon={<ArrowRight size={14} />}
              >
                Next question
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleReviewAndSubmit}
                className="w-full sm:w-auto justify-center px-6 py-2 text-xs font-bold"
                rightIcon={<Check size={14} />}
              >
                Review and submit
              </Button>
            )}
          </div>
        </div>

        {/* U13 Review and Submit Modal */}
        <ConfirmationModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmSubmit}
          title="Ready to see your next steps?"
          description={
            submissionError
              ? submissionError
              : 'Check that your answers reflect where you are today. You can go back and change them before submitting.'
          }
          cancelLabel="Review my answers"
          confirmLabel={isSubmitting ? 'Preparing your readiness results…' : 'Submit assessment'}
          variant="primary"
          icon="check"
          isLoading={isSubmitting}
        />

        {/* Unsaved changes confirmation modal */}
        <ConfirmationModal
          isOpen={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
          onConfirm={() => navigate('/assessment')}
          title="You have changes that haven’t been saved. Leave this page?"
          description="You have changes that haven’t been saved. Leave this page?"
          cancelLabel="Keep editing"
          confirmLabel="Leave page"
          variant="warning"
          icon="warning"
        />
      </div>
    </div>
  );
};
