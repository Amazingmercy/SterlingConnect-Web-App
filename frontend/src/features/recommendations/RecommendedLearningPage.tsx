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
  Sparkles,
  PlayCircle,
  Award,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useAssessment } from '../../context/AssessmentContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import type { RecommendedCourse } from '../../types/assessment';

export const RecommendedLearningPage: React.FC = () => {
  const { result } = useAssessment();
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<'All' | 'Free' | 'Essentials' | 'Fundamentals' | 'Advanced'>('All');
  const [apiCourses, setApiCourses] = useState<RecommendedCourse[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // If user completed assessment, get tailored courses for the 3 priority areas; otherwise use default catalog
  const isUserCompleted = Boolean(user?.hasCompletedAssessment && result);

  // Fetch recommendations from Recommendation Engine API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
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
            academyUrl: item.enrollmentUrl || item.academyUrl || 'https://learn.sterlinglrs.com',
            description: item.notes || item.description || 'Targeted module designed to bridge diagnostic readiness gaps.',
            thumbnailUrl: item.thumbnailUrl,
            format: 'Sterling Short',
            access: item.isFree ? 'Free' : 'Paid',
            estimatedTime: item.duration || '2 hours',
            release: 'Launch',
            recommendationReason: item.recommendationReason,
          }));
          setApiCourses(mapped);
        } else {
          setApiCourses([]);
        }
      })
      .catch(() => {
        if (isMounted) setApiCourses([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isUserCompleted]);

  // Strictly use live courses returned from recommendations API - no mock cache fallback!
  const courses: RecommendedCourse[] = apiCourses || [];

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
    const isFree = Boolean(course.isFree);
    const duration = course.duration || '2-4 hours';
    const level = course.level || 'Essentials';
    const hasThumbnail = Boolean(course.thumbnailUrl);

    return (
      <div
        key={course.id}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:shadow-xl hover:border-[#087b63]/50 hover:-translate-y-1 transition-all duration-300"
      >
        <div>
          {/* Card Visual Header / Media */}
          <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-[#0c2340] via-[#087b63] to-[#054334]">
            {hasThumbnail ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}

            {/* Ambient Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

            {/* Decorative Brand Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
              <GraduationCap size={96} className="text-white" />
            </div>

            {/* Floating Top Badges */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2 z-10">
              {/* Access Tag */}
              {isFree ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/95 text-white shadow-md backdrop-blur-md">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Free Course</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider bg-slate-950/90 text-white border border-white/25 shadow-md backdrop-blur-md">
                  <span>₦{course.priceNGN ? course.priceNGN.toLocaleString() : '15,000'}</span>
                </span>
              )}

              {/* Level Badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/45 text-white/95 border border-white/20 backdrop-blur-md shadow-xs">
                {level}
              </span>
            </div>

            {/* Floating Bottom Metadata over Media */}
            <div className="absolute bottom-3 inset-x-3.5 z-10 flex items-center justify-between text-white/90 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] truncate drop-shadow-md">
                <Layers size={13} className="text-emerald-300 flex-shrink-0" />
                <span className="truncate">{course.categoryTitle || 'Professional Development'}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white/95 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs flex-shrink-0 drop-shadow-md">
                <Clock size={12} />
                <span>{duration}</span>
              </div>
            </div>
          </div>

          {/* Card Body Content */}
          <div className="p-5 space-y-3">
            {/* Why recommended notice */}
            {course.recommendationReason && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-semibold leading-tight">
                <Sparkles size={12} className="text-amber-600 flex-shrink-0" />
                <span className="truncate">{course.recommendationReason}</span>
              </div>
            )}

            {/* Course Title */}
            <h3 className="font-brand font-bold text-[15px] sm:text-[16px] text-[#102641] group-hover:text-[#087b63] transition-colors leading-snug line-clamp-2">
              {course.title}
            </h3>

            {/* Brief Explanation / Description */}
            <p className="text-[12.5px] text-[#526078] leading-relaxed line-clamp-3">
              {course.description}
            </p>

            {/* Meta tags */}
            <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <PlayCircle size={13} className="text-[#087b63]" />
                <span>Self-Paced</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Award size={13} className="text-[#087b63]" />
                <span>Certificate</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer & Action */}
        <div className="px-5 py-4 border-t border-slate-100 bg-[#fbfcfd] flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {isFree ? 'Tuition' : 'Academy Fee'}
            </span>
            <span className={`text-[14px] font-extrabold ${isFree ? 'text-[#087b63]' : 'text-[#102641]'}`}>
              {isFree ? '100% Free' : `₦${course.priceNGN ? course.priceNGN.toLocaleString() : '15,000'}`}
            </span>
          </div>

          <a
            href={course.academyUrl || 'https://learn.sterlinglrs.com'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Enroll in ${course.title} on Sterling Academy`}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all duration-200 group-hover:shadow-md ${
              isFree
                ? 'bg-[#087b63] text-white hover:bg-[#066350]'
                : 'bg-[#102641] text-white hover:bg-[#0a1829]'
            }`}
          >
            <span>{isFree ? 'Enroll Free' : 'View Course'}</span>
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
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
          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight size={14} />}>
              Explore opportunities
            </Button>
          </Link>
        </div>
      </div>



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
            We’ll show relevant learning here when it is available. Explore curated opportunities in the meantime.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/opportunities">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                Explore opportunities
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Academy Outbound Note (Spec U16: Before outbound navigation) */}
      {/* <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
        <ExternalLink size={15} className="text-slate-400 flex-shrink-0" />
        <span>Learning takes place on Sterling Academy. You may need to sign in there separately.</span>
      </div> */}

      {/* Special Rule Reminder */}
      {/* <div className="p-4 rounded-xl bg-[#f0f8f5] border border-[#bddbd1] flex items-start gap-3 text-xs text-[#05644f] leading-relaxed">
        <CheckCircle2 size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
        <span>
          <strong>Sterling Connect Policy: </strong>
          All scholarship readiness learning under <em>Scholarships &amp; Educational Advancement</em> is provided 100% free of charge. Paid professional courses in other categories retain published Academy pricing and are never required to become eligible for opportunity listings.
        </span>
      </div> */}
    </div>
  );

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {content}
    </div>
  );
};
