import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ClipboardList,
  RotateCcw,
  BookOpen,
  BriefcaseBusiness,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ActionItem {
  id: string;
  title: string;
  badge: 'Priority to strengthen' | 'Area to develop' | 'Steps towards your goal';
  badgeColor: string;
  dimensionLabel: string;
  checklist: string[];
}

export const ActionPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result } = useAssessment();
  const { toast } = useToast();

  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const hasCompletedAssessment = Boolean(user?.hasCompletedAssessment && result);

  if (!hasCompletedAssessment || !result) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#e3f4ed] text-[#087b63] grid place-items-center mx-auto">
          <ClipboardList size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#102641]">
            Your next steps
          </h1>
          <p className="text-sm text-[#526078] leading-relaxed max-w-lg mx-auto">
            Complete a readiness assessment to see preparation actions based on your answers. You can explore goal-based learning in the meantime.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link to="/assessment" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full justify-center" rightIcon={<ArrowRight size={14} />}>
              Assess my readiness
            </Button>
          </Link>
          <Link to="/recommendations" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full justify-center">
              Explore recommended learning
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { categoryResults } = result;

  // Build dynamic actions from lowest scoring dimensions to highest
  const actions: ActionItem[] = categoryResults.map((cat, idx) => {
    let badge: ActionItem['badge'] = 'Steps towards your goal';
    let badgeColor = 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]';

    if (cat.score < 40) {
      badge = 'Priority to strengthen';
      badgeColor = 'bg-red-50 text-red-800 border-red-200';
    } else if (cat.score < 60) {
      badge = 'Area to develop';
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    const checklist = [
      'Review the requirements relevant to your goal',
      'Prepare the evidence or materials you need',
      'Practise the skill or task',
      'Reflect on your progress',
    ];

    return {
      id: `ACT-${idx + 1}`,
      title: `Strengthen ${cat.categoryTitle}`,
      badge,
      badgeColor,
      dimensionLabel: cat.categoryTitle,
      checklist,
    };
  });

  // Sort: Priority to strengthen first, then Area to develop, then Steps towards your goal
  const sortedActions = [...actions].sort((a, b) => {
    const order = { 'Priority to strengthen': 0, 'Area to develop': 1, 'Steps towards your goal': 2 };
    return order[a.badge] - order[b.badge];
  });

  const toggleChecklistStep = (actionId: string, stepIdx: number) => {
    const key = `${actionId}-step-${stepIdx}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const markActionAsDone = (actionId: string) => {
    setCompletedActions((prev) => ({ ...prev, [actionId]: true }));
    toast('Action marked as done. You can return to it whenever you need.');
  };

  const hasAnyDone = Object.values(completedActions).some(Boolean);

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="border-b border-[#edf0f3] pb-6 space-y-2">
        <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#102641] tracking-tight">
          Your next steps
        </h1>
        <p className="text-sm text-[#526078] leading-relaxed max-w-2xl">
          Start with the actions that are most useful for your current goal. You can work on your preparation while exploring opportunities.
        </p>
      </div>

      {/* Retake Prompt when relevant actions are completed */}
      {hasAnyDone && (
        <div className="p-4 rounded-xl bg-[#e3f4ed] border border-[#bddbd1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#05644f]">
          <span className="font-medium">
            Ready to reflect on your progress? Retake your assessment when you want a new readiness result.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/assessment/questions')}
            rightIcon={<RotateCcw size={13} />}
          >
            Retake assessment
          </Button>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {sortedActions.map((action) => {
          const isDone = Boolean(completedActions[action.id]);

          return (
            <Card
              key={action.id}
              className={`p-5 sm:p-6 space-y-4 transition-all border ${
                isDone
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-white border-[#e4eaf0] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-[#087b63] flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="font-brand font-bold text-base sm:text-lg text-[#102641]">
                    {action.title}
                  </h3>
                </div>

                <div className="flex-shrink-0">
                  {!isDone ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => markActionAsDone(action.id)}
                    >
                      Mark action as done
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-[#627086]">
                      Action marked as done.
                    </span>
                  )}
                </div>
              </div>

              {/* Checklist steps */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-[#102641] block">
                  Action Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {action.checklist.map((step, idx) => {
                    const stepKey = `${action.id}-step-${idx}`;
                    const isStepChecked = isDone || Boolean(checkedSteps[stepKey]);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleChecklistStep(action.id, idx)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isStepChecked
                            ? 'bg-[#e3f4ed]/50 text-[#087b63] font-medium'
                            : 'bg-[#f8fafb] text-[#526078] hover:bg-slate-100'
                        }`}
                      >
                        <span className="mt-0.5 flex-shrink-0">
                          {isStepChecked ? (
                            <CheckCircle2 size={15} className="text-[#087b63]" />
                          ) : (
                            <Circle size={15} className="text-[#a0aec0]" />
                          )}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-[#edf0f3] flex flex-wrap items-center justify-between gap-4">
        <Link to="/recommendations">
          <Button variant="secondary" size="md" rightIcon={<BookOpen size={14} />}>
            Explore recommended learning
          </Button>
        </Link>
        <Link to="/opportunities">
          <Button variant="primary" size="md" rightIcon={<BriefcaseBusiness size={14} />}>
            Explore opportunities
          </Button>
        </Link>
      </div>
    </div>
  );
};
