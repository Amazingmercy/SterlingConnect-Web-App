import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ExternalLink,
  Target,
  ArrowRight,
  Clock,
  Star,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { getRecommendedCoursesForPriorities } from '../assessment/scoringEngine';
import { ACADEMY_COURSES } from '../assessment/data/courses';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import type { RecommendedCourse } from '../../types/assessment';

export const RecommendedLearningPage: React.FC = () => {
  const { result } = useAssessment();
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<'All' | 'Free' | 'Essentials' | 'Fundamentals' | 'Advanced'>('All');
  const [apiCourses, setApiCourses] = useState<RecommendedCourse[] | null>(null);
  const [goalNotice, setGoalNotice] = useState<string | null>(null);

  // If user completed assessment, get tailored courses for the 3 priority areas; otherwise use default catalog
  const isUserCompleted = Boolean(user?.hasCompletedAssessment && result);

  // Fetch recommendations from Recommendation Engine API
  useEffect(() => {
    let isMounted = true;
    api
      .get('/recommendations')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.recommendations && res.data.recommendations.length > 0) {
          const mapped: RecommendedCourse[] = res.data.recommendations.map((item: any) => ({
            id: item.id || item.courseCode,
            courseCode: item.courseCode,
            title: item.title,
            categoryId: item.categoryId,
            categoryTitle: item.category?.name || item.categoryTitle || 'Professional Development',
            level: (item.level
              ? item.level.charAt(0).toUpperCase() + item.level.slice(1).toLowerCase()
              : 'Essentials') as 'Essentials' | 'Fundamentals' | 'Advanced',
            isFree: Boolean(item.isFree),
            priceNGN: Number(item.priceNGN) || 0,
            duration: item.duration || '2-4 hours',
            academyUrl: item.enrollmentUrl || 'https://learn.sterlinglrs.com',
            description: item.notes || item.description || 'Targeted module designed to bridge diagnostic readiness gaps.',
            format: 'Sterling Short',
            access: item.isFree ? 'Free' : 'Paid',
            estimatedTime: item.duration || '2 hours',
            release: 'Launch',
            recommendationReason: item.recommendationReason,
          }));
          setApiCourses(mapped);
          if (res.data.goalNotice) {
            setGoalNotice(res.data.goalNotice);
          }
        }
      })
      .catch(() => {
        // Fallback to client-side rule computation
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isUserCompleted]);

  const defaultCourses: RecommendedCourse[] = isUserCompleted && result?.priorityCategories
    ? getRecommendedCoursesForPriorities(result.priorityCategories)
    : ACADEMY_COURSES;

  const courses = apiCourses && apiCourses.length > 0 ? apiCourses : defaultCourses;

  const filteredCourses = courses
    .filter((c) => {
      if (filter === 'Free') return c.isFree;
      if (filter === 'Essentials') return c.level === 'Essentials';
      if (filter === 'Fundamentals') return c.level === 'Fundamentals';
      if (filter === 'Advanced') return c.level === 'Advanced';
      return true;
    })
    .sort((a, b) => {
      // Free courses should always show before paid
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return 0;
    });

  const freeCourses = filteredCourses.filter((c) => c.isFree);
  const paidCourses = filteredCourses.filter((c) => !c.isFree);

  const renderCourseCard = (course: RecommendedCourse) => {
    const isScholarship =
      user?.pathway === 'Education & Scholarships' ||
      user?.pathway === 'Education & Scholarship Opportunities';

    const goalLabel = isScholarship ? 'Scholarship & Academic Preparation' : 'Employment & Career Readiness';
    const reasonText =
      course.recommendationReason ||
      (isUserCompleted
        ? `Recommended to help you strengthen ${course.categoryTitle}.`
        : `Suggested for your goal: ${goalLabel}.`);

    return (
      <Card
        key={course.id}
        hoverEffect
        className="flex flex-col justify-between p-5 space-y-4 border border-[#e4eaf0] bg-white rounded-xl shadow-xs"
      >
        <div className="space-y-3">
          {/* Reason text & Access badge */}
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                course.isFree
                  ? 'bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]'
                  : 'bg-slate-100 text-[#526078] border border-slate-200'
              }`}
            >
              {course.isFree ? 'Free' : 'Paid course'}
            </span>

            {!course.isFree && (
              <span className="text-[12px] font-extrabold text-[#102641]">
                ₦{course.priceNGN?.toLocaleString() || '15,000'}
              </span>
            )}
          </div>

          {/* Reason Badge */}
          <p className="text-[11px] font-semibold text-[#087b63] leading-snug">
            {reasonText}
          </p>

          {/* Category & Course Code */}
          <div className="flex items-center justify-between text-[11px]">
            <p className="font-bold text-[#102641] truncate">
              {course.categoryTitle}
            </p>
            <span className="font-mono text-[10px] text-[#627086] font-semibold">
              {course.courseCode}
            </span>
          </div>

          {/* Course Title */}
          <h3 className="font-brand font-bold text-sm text-[#102641] leading-snug min-h-[40px]">
            {course.title}
          </h3>

          {/* Canonical Specification Details (Appendix B) */}
          <div className="text-[11px] font-medium text-[#526078] bg-[#f8fafb] px-3 py-2 rounded-lg border border-[#e4eaf0] space-y-1">
            <div>
              <strong className="text-[#102641] font-semibold">Estimated learning time:</strong>{' '}
              {course.estimatedTime || course.duration || '2-4 hours'}
            </div>
            <div className="text-[10px] text-[#627086]">
              Level: {course.level} • Format: {course.format || 'Sterling Short'}
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-[#627086] leading-relaxed line-clamp-3">
            {course.description}
          </p>
        </div>

        {/* CTA Footer */}
        <div className="pt-3 border-t border-[#edf0f3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#627086] text-[11px]">
            <Clock size={13} />
            <span>{course.duration || '2-4 hours'}</span>
          </div>

          <a
            href={course.academyUrl || 'https://learn.sterlinglrs.com'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${course.title} on Sterling Academy in a new tab`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087b63] text-white hover:bg-[#066350] font-bold text-xs shadow-xs transition"
          >
            <span>View on Sterling Academy</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </Card>
    );
  };

  const content = (
    <div className="space-y-8">
      {/* Header (Screen U16) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#edf0f3] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1] text-[11px] font-bold mb-2">
            <Target size={14} />
            <span>Learning and Opportunity Journeys</span>
          </div>
          <h1 className="font-brand font-extrabold text-2xl sm:text-3xl text-[#112440] tracking-tight">
            Learning for your next step
          </h1>
          <p className="text-xs sm:text-sm text-[#627086] mt-1 max-w-2xl">
            Explore practical learning linked to your preparation and goals. Choose what is useful for you.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link to="/action-plan" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full justify-center">
              View my action plan
            </Button>
          </Link>
          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight size={14} />}>
              Explore opportunities
            </Button>
          </Link>
        </div>
      </div>

      {/* Goal Notice if diagnostic has not been taken yet */}
      {goalNotice && !isUserCompleted && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-amber-700 flex-shrink-0" />
            <span>{goalNotice}</span>
          </div>
          <Link to="/assessment" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full justify-center">
              Start assessment
            </Button>
          </Link>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#f2f4f9] p-1.5 rounded-[10px] border border-[#e4eaf0] overflow-x-auto max-w-full no-scrollbar">
          {(['All', 'Free', 'Essentials', 'Fundamentals', 'Advanced'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                filter === tab
                  ? 'bg-[#087b63] text-white shadow-xs'
                  : 'text-[#42516a] hover:text-[#102641]'
              }`}
            >
              {tab === 'Free' ? 'Free Courses' : tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-[#627086] font-medium">
          Showing {filteredCourses.length} mapped learning resource{filteredCourses.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Content Sections */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-10">
          {/* Free Learning Section */}
          {freeCourses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#102641]">
                    Start with free learning
                  </h2>
                  <p className="text-xs text-[#627086]">
                    Core foundation and diagnostic bridge modules freely accessible to all candidates.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#087b63] bg-[#e3f4ed] px-2.5 py-1 rounded-full border border-[#bddbd1]">
                  {freeCourses.length} Free Course{freeCourses.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freeCourses.map((c) => renderCourseCard(c))}
              </div>
            </div>
          )}

          {/* Optional Paid Courses for Deeper Learning (Screen U16) */}
          {paidCourses.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-[#edf0f3]">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-bold text-[#102641]">
                  Optional courses for deeper learning
                </h2>
                <p className="text-xs text-[#627086] leading-relaxed">
                  These courses are optional. You can use Sterling Connect and apply for opportunities without buying a course.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paidCourses.map((c) => renderCourseCard(c))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State (Screen U16) */
        <div className="p-12 text-center bg-white rounded-xl border border-[#e4eaf0] space-y-4">
          <BookOpen size={32} className="mx-auto text-[#627086]" />
          <h3 className="font-brand font-bold text-base text-[#102641]">
            We’ll show relevant learning here when it is available.
          </h3>
          <p className="text-xs text-[#627086] max-w-md mx-auto leading-relaxed">
            We’ll show relevant learning here when it is available. You can work on your action plan in the meantime.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/action-plan">
              <Button variant="primary" size="sm">
                View my action plan
              </Button>
            </Link>
            <Link to="/opportunities">
              <Button variant="secondary" size="sm">
                Explore opportunities
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Academy Outbound Note (Spec U16: Before outbound navigation) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
        <ExternalLink size={15} className="text-slate-400 flex-shrink-0" />
        <span>Learning takes place on Sterling Academy. You may need to sign in there separately.</span>
      </div>

      {/* Special Rule Reminder */}
      <div className="p-4 rounded-xl bg-[#f0f8f5] border border-[#bddbd1] flex items-start gap-3 text-xs text-[#05644f] leading-relaxed">
        <CheckCircle2 size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
        <span>
          <strong>Sterling Connect Policy: </strong>
          All scholarship readiness learning under <em>Scholarships &amp; Educational Advancement</em> is provided 100% free of charge. Paid professional courses in other categories retain published Academy pricing and are never required to become eligible for opportunity listings.
        </span>
      </div>
    </div>
  );

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {content}
    </div>
  );
};
