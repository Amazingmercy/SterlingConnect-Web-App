import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GraduationCap,
  BriefcaseBusiness,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  Award,
  Globe2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isFullyVerified = isAuthenticated && Boolean(user?.isEmailVerified);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePathwayPreview, setActivePathwayPreview] = useState<'career' | 'scholarship'>('career');

  const steps = [
    {
      num: '01',
      title: 'Assess your readiness.',
      desc: 'Complete our diagnostic across 10 vital domains to map your strengths.',
    },
    {
      num: '02',
      title: 'Choose practical next actions.',
      desc: 'Prioritize targeted capability modules and application milestones.',
    },
    {
      num: '03',
      title: 'Explore opportunities.',
      desc: 'Discover verified jobs, fellowships, and scholarships matching your profile.',
    },
    {
      num: '04',
      title: 'Apply through official channels.',
      desc: 'Submit directly on provider portals with verified confidence.',
    },
    {
      num: '05',
      title: 'Track your progress.',
      desc: 'Log stages, record interview invites, and manage every outcome in one hub.',
    },
  ];

  const faqs = [
    {
      q: 'Is Sterling Connect free?',
      a: 'The readiness assessments, opportunity discovery, saved list and application tracker are free. Some professional courses on Sterling Academy are paid and optional. Scholarship learning is free.',
    },
    {
      q: 'Can I use both pathways?',
      a: 'Yes. Choose one or both pathways and switch between them. Your career and scholarship readiness results are kept separately.',
    },
    {
      q: 'Do I need a high readiness score to apply?',
      a: 'No. Your result helps you plan your preparation. You can explore opportunities and apply regardless of your readiness score. Always check the provider’s requirements.',
    },
    {
      q: 'Does Sterling handle my application?',
      a: 'You apply through the employer’s or scholarship provider’s official process. Sterling Connect helps you organise opportunities and record your progress.',
    },
    {
      q: 'Does a strong match mean I am eligible?',
      a: 'No. A match describes how your profile aligns with the information available. Check all requirements on the official website.',
    },
    {
      q: 'Will completing a course change my score?',
      a: 'Your readiness result changes when you complete a new assessment. Buying or completing learning does not automatically increase your score.',
    },
  ];

  return (
    <div className="flex flex-col bg-[#f8fafb]">
      {/* Hero Section: Direct start with Headline (No eyebrow), Imagery & Interactive Cards */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f4faf7] to-[#f8fafb] px-6 sm:px-12 pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-[#edf0f3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Direct Headline, Intro & Distinct Contextual CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow - Exact Display Copy */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1] text-[11px] font-bold uppercase tracking-wider">
              <span>Sterling Connect</span>
            </div>

            {/* Headline - Exact Copy */}
            <h1 className="font-brand font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#102641] leading-[1.08] tracking-tight">
              Build your readiness.{' '}
              <span className="text-[#087b63] block mt-1.5">Find your next opportunity.</span>
            </h1>

            {/* Intro - Exact Copy */}
            <p className="text-base sm:text-lg leading-relaxed text-[#526078] max-w-2xl">
              Understand where you are, strengthen your preparation, explore relevant jobs and scholarships, and keep track of what happens next.
            </p>

            {/* Actions - Exact CTAs: primary_cta Get started / Continue to dashboard, secondary_cta Browse opportunities */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              <Link to={isFullyVerified ? '/dashboard' : '/register'} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full justify-center" rightIcon={<ArrowRight size={15} />}>
                  {isFullyVerified ? 'Continue to dashboard' : 'Get started'}
                </Button>
              </Link>
              <Link to="/opportunities" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full justify-center">
                  Browse opportunities
                </Button>
              </Link>
            </div>

            {/* About Navigation Link from Home Page */}
            <div className="pt-2 flex items-center gap-2 text-xs text-[#627086]">
              <span>Learn about our mission:</span>
              <Link
                to="/about"
                className="font-bold text-[#087b63] hover:text-[#05644f] inline-flex items-center gap-1 hover:underline"
              >
                <span>About Sterling Connect</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Trust Metrics Pill Strip */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#e4eaf0] max-w-xl">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#102641] font-brand">10</div>
                <div className="text-[11px] text-[#627086] font-medium">Diagnostic Domains</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#102641] font-brand">45+</div>
                <div className="text-[11px] text-[#627086] font-medium">Curated Opportunities</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#087b63] font-brand">100% Free</div>
                <div className="text-[11px] text-[#627086] font-medium">Core Platform</div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Photography with Interactive Floating Preview Cards */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Photo: Ambitious Professionals & Scholars collaborating */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] sm:aspect-[5/4]">
                <img
                  src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=1000&q=80"
                  alt="Ambitious young African professionals collaborating in modern office"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102641]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#a8f0d9]">
                    Bridging Readiness to Global Impact
                  </div>
                  <div className="text-sm font-extrabold font-brand">
                    Empowering African talent for scholarships and high-growth careers
                  </div>
                </div>
              </div>

              {/* Floating Interactive Card 1: Diagnostic Readiness Benchmark */}
              <div className="absolute -top-6 -left-6 sm:-left-8 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#e4eaf0] shadow-xl space-y-2 max-w-[210px] hidden sm:block animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#e3f4ed] text-[#087b63] grid place-items-center flex-shrink-0">
                    <Award size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-extrabold tracking-wider text-[#627086]">Diagnostic</div>
                    <div className="text-xs font-bold text-[#102641]">Readiness Score</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-[#087b63] font-brand">82%</span>
                  <span className="text-[10px] font-bold text-[#087b63] bg-[#e3f4ed] px-1.5 py-0.5 rounded-full">Proficient</span>
                </div>
                <div className="w-full bg-[#e4eaf0] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#087b63] h-full w-[82%] rounded-full" />
                </div>
              </div>

              {/* Floating Interactive Card 2: Verified Opportunity Match */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#e4eaf0] shadow-xl space-y-1.5 max-w-[230px] hidden sm:block animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 grid place-items-center flex-shrink-0">
                    <Award size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600">Top Match</div>
                    <div className="text-xs font-bold text-[#102641] truncate">Chevening Scholarships</div>
                  </div>
                </div>
                <div className="text-[11px] text-[#627086] flex items-center justify-between">
                  <span>Full Funding</span>
                  <span className="font-bold text-[#087b63]">Verified Provider</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Pathways Section (Interactive Photographic Cards) */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 bg-white border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#087b63]">
              TAILORED OPPORTUNITY PATHWAYS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102641] font-brand tracking-tight">
              Choose your focus or pursue both simultaneously
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Career & Employment Card with Photo */}
            <div className="rounded-3xl border border-[#e4eaf0] bg-[#f8fafb] overflow-hidden hover:bg-white hover:border-[#bddbd1] hover:shadow-card transition-all flex flex-col justify-between group">
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                  alt="Young African professional in tech and business"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 flex items-center gap-1.5 shadow-xs">
                  <BriefcaseBusiness size={14} />
                  <span>Employment Focus</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-2xl font-extrabold text-[#102641] font-brand">
                    Career &amp; Employment
                  </h3>
                  <p className="text-sm text-[#526078] leading-relaxed">
                    Prepare for jobs, internships, graduate programmes and fellowships with a clearer profile and practical next steps.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#edf0f3] flex items-center justify-between">
                  <Link to={isFullyVerified ? '/opportunities?tab=Career+%26+Employment' : '/register?pathway=employment'}>
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={14} />}>
                      Explore Career Pathway
                    </Button>
                  </Link>
                  <Link
                    to="/opportunities?tab=Career+%26+Employment"
                    className="text-xs font-bold text-[#087b63] hover:underline"
                  >
                    View jobs &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Education & Scholarships Card with Photo */}
            <div className="rounded-3xl border border-[#e4eaf0] bg-[#f8fafb] overflow-hidden hover:bg-white hover:border-[#bddbd1] hover:shadow-card transition-all flex flex-col justify-between group">
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                  alt="African scholars and graduate students"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#087b63] flex items-center gap-1.5 shadow-xs">
                  <GraduationCap size={14} />
                  <span>Scholarship Focus</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-2xl font-extrabold text-[#102641] font-brand">
                    Education &amp; Scholarships
                  </h3>
                  <p className="text-sm text-[#526078] leading-relaxed">
                    Clarify your study goals, strengthen your application preparation and explore scholarships that may fit your profile.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#edf0f3] flex items-center justify-between">
                  <Link to={isFullyVerified ? '/opportunities?tab=Education+%26+Scholarships' : '/register?pathway=scholarship'}>
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={14} />}>
                      Explore Scholarships
                    </Button>
                  </Link>
                  <Link
                    to="/opportunities?tab=Education+%26+Scholarships"
                    className="text-xs font-bold text-[#087b63] hover:underline"
                  >
                    View funding &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section: From preparation to opportunity (Exact Copy) */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 bg-[#f8fafb] border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#087b63]">
              THE PROGRESSION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102641] font-brand tracking-tight">
              From preparation to opportunity
            </h2>
            <p className="text-sm text-[#627086]">
              A disciplined, five-step progression to maximize your success.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-6 rounded-2xl border border-[#e4eaf0] bg-white shadow-2xs hover:shadow-card hover:border-[#bddbd1] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="w-9 h-9 rounded-full bg-[#f0f8f5] text-[#087b63] font-mono font-extrabold text-xs grid place-items-center group-hover:bg-[#087b63] group-hover:text-white transition-colors">
                  {s.num}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#102641] leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-[#627086] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academy Panel with Original Soft Mint/Sage Colors (#e9f3ef) & Boundary Disclaimer */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 bg-white border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-[#e9f3ef] rounded-3xl overflow-hidden border border-[#bddbd1] shadow-sm grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Photo Column */}
            <div className="md:col-span-5 min-h-[260px] md:min-h-[360px] relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1100&q=85"
                alt="Professional candidate learning on Sterling Academy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Copy Column */}
            <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-4 text-left">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#087b63]">
                STERLING ACADEMY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-brand tracking-tight text-[#102641] leading-tight">
                Build the skills behind your next move
              </h2>
              <p className="text-sm text-[#526078] leading-relaxed max-w-xl">
                Your recommendations can include free Sterling Shorts and optional paid courses on Sterling Academy. Scholarship learning is free.
              </p>

              <div className="pt-2">
                <a
                  href="https://learn.sterlinglrs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Sterling Academy in a new tab"
                  className="inline-block"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ExternalLink size={15} />}
                  >
                    Explore Sterling Academy
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Boundary Notice - Exact Copy beneath explanation */}
          <div className="p-4 rounded-xl bg-white border border-[#e4eaf0] text-xs text-[#526078] leading-relaxed shadow-2xs">
            <strong className="text-[#102641] font-semibold">Boundary notice: </strong>
            Sterling Connect supports preparation and opportunity discovery. It does not guarantee eligibility, selection, employment or scholarship awards.
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Exact copy from spec) */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 bg-[#f8fafb]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#087b63]">
              COMMON QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#102641] font-brand tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#e4eaf0] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-bold text-[#102641]">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-[#087b63] flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#526078] leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
