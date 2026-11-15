import React, { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Calendar,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useAssessment } from '../../context/AssessmentContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useApplications } from '../../context/ApplicationContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getRecommendedCoursesForPriorities } from '../assessment/scoringEngine';
import type { Opportunity } from '../../types/opportunity';
import type { PerformanceBand } from '../../types/assessment';

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { result: assessmentResult, isCompleted: isAssessmentCompleted } = useAssessment();
  const { opportunities, getEvaluation } = useOpportunities();
  const { applications, metrics: appMetrics } = useApplications();

  const firstName = user?.firstName || 'Candidate';
  const pathwayLabel =
    user?.pathway === 'Employment & Career Opportunities'
      ? 'Career & Employment'
      : user?.pathway === 'Education & Scholarship Opportunities'
      ? 'Education & Scholarships'
      : user?.pathway || 'Career & Employment';
  const avatarInitial = (firstName[0] || 'C').toUpperCase();

  // Strict user-based completion verification: assessment must belong to THIS user and be marked completed
  const isUserCompleted = Boolean(user?.hasCompletedAssessment && assessmentResult);

  // Completion & readiness score
  const profileScore = profile.completionPercentage !== undefined ? profile.completionPercentage : 0;
  const readinessScore = isUserCompleted ? (assessmentResult?.overallScore ?? 0) : 0;

  const readinessBand: PerformanceBand | null = useMemo(() => {
    if (!isUserCompleted || !assessmentResult) return null;
    if (readinessScore >= 75) return 'Proficient';
    if (readinessScore >= 50) return 'Developing';
    if (readinessScore >= 25) return 'Foundational';
    return 'Emerging';
  }, [isUserCompleted, assessmentResult, readinessScore]);

  // Live Recommended courses fetched from recommendation rules engine
  const [apiRecommendedCourses, setApiRecommendedCourses] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/recommendations')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.recommendations && res.data.recommendations.length > 0) {
          setApiRecommendedCourses(res.data.recommendations);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.id, isUserCompleted]);

  // Recommended courses for priority areas (prioritizes live Admin Recommendation Rules)
  const recommendedCourses = useMemo(() => {
    if (apiRecommendedCourses.length > 0) {
      return apiRecommendedCourses;
    }
    if (!isUserCompleted || !assessmentResult || !assessmentResult.priorityCategories) return [];
    return getRecommendedCoursesForPriorities(assessmentResult.priorityCategories);
  }, [apiRecommendedCourses, isUserCompleted, assessmentResult]);

  // Evaluated Opportunities with match labels
  const evaluatedOpportunities = useMemo(() => {
    return opportunities.map((opp) => {
      const evaluation = getEvaluation(opp);
      return {
        ...opp,
        matchLabel: evaluation.displayLabel,
        fitScore: evaluation.score,
      };
    });
  }, [opportunities, getEvaluation]);

  // Next 3 Actions logic
  const nextActions = useMemo(() => {
    const actions: {
      id: string;
      title: string;
      subtitle: string;
      buttonText: string;
      route: string;
      type: 'assessment' | 'opportunity' | 'profile' | 'application';
    }[] = [];

    // 1. Assessment or Learning
    if (!isUserCompleted) {
      actions.push({
        id: 'act-assessment',
        title: 'Complete Universal Readiness Assessment',
        subtitle: '50 statements across 10 domains to unlock personalized training.',
        buttonText: 'Start Assessment',
        route: '/assessment',
        type: 'assessment',
      });
    } else if (recommendedCourses.length > 0) {
      const topCourse = recommendedCourses[0];
      actions.push({
        id: 'act-course',
        title: `Start "${topCourse.title}"`,
        subtitle: `${topCourse.duration} • Free course addressing priority focus area`,
        buttonText: 'Continue',
        route: '/recommendations',
        type: 'assessment',
      });
    }

    // 2. Urgent Application or Opportunity
    const preparingApps = applications.filter(
      (a) => a.status === 'PREPARING' || a.status === 'SAVED'
    );
    if (preparingApps.length > 0) {
      const app = preparingApps[0];
      const opp = opportunities.find((o: Opportunity) => o.id === app.opportunityId);
      actions.push({
        id: 'act-app',
        title: `Progress Application: ${opp?.title || 'Saved Opportunity'}`,
        subtitle: opp ? `Deadline: ${opp.deadline}` : 'In preparation',
        buttonText: 'View',
        route: '/applications',
        type: 'application',
      });
    } else if (evaluatedOpportunities.length > 0) {
      const topOpp = evaluatedOpportunities[0];
      actions.push({
        id: 'act-opp',
        title: `Review New Match: ${topOpp.title}`,
        subtitle: `${topOpp.organization} • ${topOpp.matchLabel.replace('_', ' ')}`,
        buttonText: 'Explore',
        route: `/opportunities/${topOpp.id}`,
        type: 'opportunity',
      });
    }

    // 3. Profile Completion
    if (profileScore < 100) {
      actions.push({
        id: 'act-profile',
        title: 'Complete Your Candidate Profile',
        subtitle: `Profile strength is ${profileScore}%. Adding transcripts unlocks higher match rank.`,
        buttonText: 'Complete',
        route: '/profile',
        type: 'profile',
      });
    } else {
      actions.push({
        id: 'act-catalog',
        title: 'Explore Closing Opportunities',
        subtitle: 'Apply for opportunities closing in the next 14 days.',
        buttonText: 'Browse',
        route: '/opportunities?tab=Closing+Soon',
        type: 'opportunity',
      });
    }

    return actions.slice(0, 3);
  }, [
    isUserCompleted,
    recommendedCourses,
    applications,
    opportunities,
    evaluatedOpportunities,
    profileScore,
  ]);

  // Top 3 matched opportunities
  const topMatchedOpportunities = useMemo(() => {
    return evaluatedOpportunities.slice(0, 3);
  }, [evaluatedOpportunities]);

  // 4-Step Flexible Onboarding Tracker
  const isAccountDone = Boolean(user?.isEmailVerified);
  const isPathwayDone = Boolean(user?.pathway);
  const isProfileDone =
    profileScore >= 50 ||
    Boolean(profile.common.countryOfResidence && profile.common.currentStatus);
  const isAssessmentDone = Boolean(user?.hasCompletedAssessment && assessmentResult);

  const onboardingSteps = useMemo(
    () => [
      {
        step: 1,
        title: 'Account Verification',
        shortTitle: 'Account',
        desc: 'Verify email with one-time verification code',
        isDone: isAccountDone,
        route: '/verify-email',
        badge: isAccountDone ? 'Verified' : 'Pending',
      },
      {
        step: 2,
        title: 'Pathway Selection',
        shortTitle: 'Pathway',
        desc: 'Choose career or scholarship goals',
        isDone: isPathwayDone,
        route: '/pathway',
        badge: isPathwayDone ? 'Selected' : 'Pending',
      },
      {
        step: 3,
        title: 'Candidate Profile',
        shortTitle: 'Profile',
        desc: 'Academic credentials & verified documents',
        isDone: isProfileDone,
        route: '/profile',
        badge: isProfileDone ? `${profileScore}% Done` : 'Pending',
      },
      {
        step: 4,
        title: 'Readiness Diagnostic',
        shortTitle: 'Assessment',
        desc: '10-domain universal readiness evaluation',
        isDone: isAssessmentDone,
        route: '/assessment',
        badge: isAssessmentDone ? `${readinessScore}% Score` : 'Pending',
      },
    ],
    [
      isAccountDone,
      isPathwayDone,
      isProfileDone,
      isAssessmentDone,
      profileScore,
      readinessScore,
    ]
  );

  const completedStepsCount = useMemo(() => {
    return onboardingSteps.filter((s) => s.isDone).length;
  }, [onboardingSteps]);

  const nextIncompleteStep = useMemo(() => {
    return onboardingSteps.find((s) => !s.isDone);
  }, [onboardingSteps]);

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner (sc-dashboard-welcome) */}
      <div className="bg-white rounded-2xl border border-[#e4eaf0] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-[#627086] flex items-center gap-2 flex-wrap">
            <span>Your active goal:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e3f4ed] text-[#087b63]">
              {pathwayLabel}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              Browse Opportunities
            </Button>
          </Link>
          <Link to="/assessment" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight size={14} />}>
              Diagnostic
            </Button>
          </Link>
        </div>
      </div>

      {/* Flexible Onboarding Progress Card (hidden when 100% complete) */}
      {completedStepsCount < 4 && (
        <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
                ONBOARDING SETUP
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]">
                {completedStepsCount === 4 ? (
                  <>
                    <CheckCircle2 size={13} className="text-[#087b63]" />
                    <span>4/4 Steps Completed</span>
                  </>
                ) : (
                  <span>{completedStepsCount}/4 Steps Completed</span>
                )}
              </span>
            </div>
            <h2 className="font-brand font-bold text-lg text-[#102641]">
              {completedStepsCount === 4
                ? 'Your Onboarding is 100% Complete!'
                : 'Complete Your Setup Journey'}
            </h2>
            <p className="text-xs text-[#627086]">
              {completedStepsCount === 4
                ? 'All four onboarding milestones are verified. Your profile and readiness diagnostic are fully active for optimal opportunity matching.'
                : 'Follow the 4 steps flexibly at your own pace to calibrate your candidate profile, pathway targeting, and eligibility ranking.'}
            </p>
          </div>

          {/* Quick Action CTA when incomplete */}
          {nextIncompleteStep && (
            <div className="flex-shrink-0">
              <Link to={nextIncompleteStep.route}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight size={13} />}>
                  Continue Step {nextIncompleteStep.step}: {nextIncompleteStep.shortTitle}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#627086]">
            <span>Setup Progress</span>
            <span className="font-extrabold text-[#102641]">
              {completedStepsCount} of 4 Completed ({Math.round((completedStepsCount / 4) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-[#e4eaf0] h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#087b63] rounded-full transition-all duration-500"
              style={{ width: `${(completedStepsCount / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {onboardingSteps.map((step) => {
            const isNext = step.step === nextIncompleteStep?.step;

            return (
              <Link
                key={step.step}
                to={step.route}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between group ${
                  step.isDone
                    ? 'border-[#bddbd1] bg-[#f8faf9] hover:bg-[#f0f8f5]'
                    : isNext
                    ? 'border-[#087b63] bg-white ring-2 ring-[#087b63]/20 shadow-xs hover:border-[#087b63]'
                    : 'border-[#e4eaf0] bg-white opacity-80 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-brand font-extrabold text-xs transition-colors ${
                        step.isDone
                          ? 'bg-[#087b63] text-white shadow-xs'
                          : isNext
                          ? 'bg-[#102641] text-white'
                          : 'bg-slate-100 text-[#627086] border border-slate-200'
                      }`}
                    >
                      {step.isDone ? <Check size={14} strokeWidth={3} /> : step.step}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        step.isDone
                          ? 'bg-[#e3f4ed] text-[#087b63]'
                          : isNext
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-[#627086]'
                      }`}
                    >
                      {step.isDone ? 'Completed' : isNext ? 'Next Up' : 'Pending'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-brand font-bold text-xs text-[#102641] group-hover:text-[#087b63] transition-colors flex items-center justify-between">
                      <span>{step.title}</span>
                      <ChevronRight
                        size={13}
                        className="text-slate-400 group-hover:text-[#087b63] group-hover:translate-x-0.5 transition-transform"
                      />
                    </h4>
                    <p className="text-[11px] text-[#627086] mt-0.5 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Status</span>
                  <span
                    className={`font-bold ${
                      step.isDone
                        ? 'text-[#087b63]'
                        : isNext
                        ? 'text-[#102641]'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
      )}

        {/* Top 2 Columns: Readiness Score & Next 3 Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Universal Readiness Card (5 cols) */}
          <Card className="lg:col-span-5 p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-brand font-bold text-sm text-[#102641] uppercase tracking-wider">
                  Your Readiness Status
                </h3>
                {isUserCompleted && readinessBand && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e3f4ed] text-[#087b63]">
                    {readinessBand}
                  </span>
                )}
              </div>

              {isUserCompleted ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                  {/* Conic Gradient Ring */}
                  <div
                    className="w-28 h-28 rounded-full grid place-items-center relative flex-shrink-0"
                    style={{
                      background: `conic-gradient(#087b63 ${readinessScore}%, #e8edf5 0)`,
                    }}
                  >
                    <div className="w-22 h-22 rounded-full bg-white flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#102641] font-brand leading-none">
                        {readinessScore}%
                      </span>
                      <span className="text-[10px] font-semibold text-[#627086] mt-0.5">Overall</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <div className="text-sm font-bold text-[#102641]">
                      Readiness Band: <span className="text-[#087b63]">{readinessBand}</span>
                    </div>
                    <p className="text-xs text-[#627086] leading-relaxed">
                      Assessed across 10 Sterling Academy domains. Recommendations prioritized by score.
                    </p>
                    {assessmentResult?.priorityCategories && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[10px] uppercase font-bold text-[#627086] tracking-wider">
                          Priority Focus Areas:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {assessmentResult.priorityCategories.map((cat) => (
                            <span
                              key={cat.categoryId}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                            >
                              {cat.categoryTitle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 grid place-items-center mx-auto">
                    <TrendingUp size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-[#102641]">
                    Your readiness
                  </h4>
                  <p className="text-xs text-[#627086] max-w-xs mx-auto leading-relaxed">
                    You haven’t completed this readiness assessment yet. Start when you’re ready to reflect on your preparation.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {isUserCompleted ? (
                <>
                  <Link
                    to="/assessment/results"
                    className="text-xs font-bold text-[#087b63] hover:text-[#05644f] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View full report</span>
                    <ArrowRight size={14} />
                  </Link>
                  <Link to="/recommendations">
                    <Button variant="secondary" size="sm">
                      Recommended Courses
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/assessment" className="w-full">
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Assess my readiness
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Your next steps (Top 3 actions) */}
          <Card className="lg:col-span-7 p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-brand font-bold text-sm text-[#102641] uppercase tracking-wider">
                  Your next steps
                </h3>
                <Link to="/action-plan" className="text-[11px] font-bold text-[#087b63] hover:underline flex items-center gap-1">
                  <span>View all actions</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="space-y-3">
                {nextActions.map((action, idx) => (
                  <div
                    key={action.id}
                    className="p-3.5 rounded-xl border border-[#e4eaf0] bg-[#f8fafb] hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#102641] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-[#102641] truncate">
                          {action.title}
                        </div>
                        <div className="text-[11px] text-[#627086] truncate">
                          {action.subtitle}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={idx === 0 ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => navigate(action.route)}
                      className="flex-shrink-0 text-xs px-3 py-1.5"
                    >
                      {action.buttonText}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#627086]">
              <span>Need help organizing your application materials?</span>
              <Link
                to="/profile"
                className="font-bold text-[#087b63] hover:text-[#05644f] flex items-center gap-1"
              >
                <span>Update Profile</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Middle Row: Applications Pipeline Snapshot & Profile Strength */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Applications Pipeline Snapshot (8 cols) */}
          <Card className="lg:col-span-8 p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-brand font-bold text-sm text-[#102641] uppercase tracking-wider">
                  Your Applications Pipeline
                </h3>
                <p className="text-xs text-[#627086] mt-0.5">
                  Track submissions, scheduled interviews, and incoming decisions.
                </p>
              </div>
              <Link
                to="/applications"
                className="text-xs font-bold text-[#087b63] hover:text-[#05644f] flex items-center gap-1"
              >
                <span>View all ({appMetrics.total})</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Quick 4 Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafb] text-center">
                <div className="text-xl font-extrabold text-[#102641] font-brand">
                  {appMetrics.total}
                </div>
                <div className="text-[11px] text-[#627086] font-medium mt-0.5">Total Tracked</div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 text-center">
                <div className="text-xl font-extrabold text-blue-700 font-brand">
                  {appMetrics.preparing}
                </div>
                <div className="text-[11px] text-blue-700 font-medium mt-0.5">In Preparation</div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 text-center">
                <div className="text-xl font-extrabold text-amber-800 font-brand">
                  {appMetrics.applied}
                </div>
                <div className="text-[11px] text-amber-800 font-medium mt-0.5">Submitted</div>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/50 text-center">
                <div className="text-xl font-extrabold text-purple-700 font-brand">
                  {appMetrics.inProgress}
                </div>
                <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                  Interview / Shortlisted
                </div>
              </div>
            </div>

            {/* Recent active applications */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-[#102641] uppercase tracking-wider">
                Recent Active Trackers
              </div>

              {applications.length > 0 ? (
                applications.slice(0, 2).map((app) => {
                  const opp =
                    app.opportunity ||
                    opportunities.find(
                      (o: Opportunity) => o.id === app.opportunityId || o.referenceCode === app.opportunityId
                    );
                  return (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl border border-[#e4eaf0] flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#e3f4ed] text-[#087b63] grid place-items-center flex-shrink-0 font-bold text-xs">
                          {opp?.organization?.[0] || 'S'}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-bold text-[#102641] truncate">
                            {opp?.title || 'Tracked Application'}
                          </div>
                          <div className="text-[11px] text-[#627086] truncate">
                            {opp?.organization} • Status:{' '}
                            <strong className="text-[#102641]">{app.status}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to="/applications">
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[#627086]">
                  No applications tracked yet. Start browsing opportunities!
                </div>
              )}
            </div>
          </Card>

          {/* Profile Strength Widget (4 cols) */}
          <Card className="lg:col-span-4 p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-brand font-bold text-sm text-[#102641] uppercase tracking-wider">
                  Profile Strength
                </h3>
                <span className="text-xs font-bold text-[#087b63]">{profileScore}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#087b63] rounded-full transition-all duration-300"
                  style={{ width: `${profileScore}%` }}
                />
              </div>

              <p className="text-xs text-[#627086] leading-relaxed">
                A complete profile ensures opportunities matching matches your verified degree
                classification, nationality, and career level.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-[#087b63]" />
                  <span className="text-[#102641]">Personal & Citizenship Details</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-[#087b63]" />
                  <span className="text-[#102641]">Highest Qualification & GPA</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {profile.documents && profile.documents.length > 0 ? (
                    <CheckCircle2 size={14} className="text-[#087b63]" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                  <span className={profile.documents?.length ? 'text-[#102641]' : 'text-slate-500'}>
                    CV & Academic Transcripts
                  </span>
                </div>
              </div>
            </div>

            <Link to="/profile" className="w-full pt-2">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Edit Candidate Profile
              </Button>
            </Link>
          </Card>
        </div>

        {/* Bottom Section: Matched Opportunities Curated For You */}
        <div className="bg-white rounded-2xl border border-[#e4eaf0] p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-brand font-bold text-base text-[#102641]">
                Recommended Opportunities For You
              </h3>
              <p className="text-xs text-[#627086] mt-0.5">
                Targeted scholarships and career roles filtered for your profile and career pathway.
              </p>
            </div>

            <Link
              to="/opportunities"
              className="text-xs font-bold text-[#087b63] hover:text-[#05644f] flex items-center gap-1"
            >
              <span>Explore all opportunities</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMatchedOpportunities.map((opp: Opportunity & { matchLabel: string }) => (
              <div
                key={opp.id}
                className="p-5 rounded-xl border border-[#e4eaf0] bg-[#f8fafb] hover:bg-white hover:border-[#bddbd1] hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e3f4ed] text-[#087b63]">
                      {opp.matchLabel.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#627086] font-mono">
                      {opp.referenceCode}
                    </span>
                  </div>

                  <h4 className="font-brand font-bold text-sm text-[#102641] line-clamp-2">
                    {opp.title}
                  </h4>

                  <p className="text-xs text-[#087b63] font-semibold">{opp.organization}</p>

                  <p className="text-[11px] text-[#627086] line-clamp-2">{opp.overview}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-[#627086]">
                    Deadline: <strong className="text-[#102641] font-semibold">{opp.deadline}</strong>
                  </span>
                  <Link to={`/opportunities/${opp.id}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={12} />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};
