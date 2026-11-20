import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  GraduationCap,
  BriefcaseBusiness,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Target,
  Award,
  Globe2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const AboutPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isFullyVerified = isAuthenticated && Boolean(user?.isEmailVerified);

  return (
    <div className="flex flex-col bg-[#f8fafb]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#f5faf8] via-[#edf5f3] to-[#e3eee9] px-6 sm:px-12 py-16 sm:py-20 border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1] text-[11px] font-bold uppercase tracking-wider">
              <Compass size={13} />
              <span>About Sterling Connect</span>
            </div>

            <h1 className="font-brand font-extrabold text-3xl sm:text-5xl text-[#102641] leading-[1.12] tracking-tight">
              Bridging the divide between readiness and global opportunity.
            </h1>

            <p className="text-base text-[#526078] leading-relaxed">
              Sterling Connect is developed by Sterling Learning &amp; Research Solutions to empower ambitious students, graduates, and professionals across the continent and beyond. We provide diagnostic readiness benchmarking, targeted capability development, and curated opportunities to help candidates thrive.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={isFullyVerified ? '/dashboard' : '/sign-in'}>
                <Button variant="primary" rightIcon={<ArrowRight size={14} />}>
                  {isFullyVerified ? 'Continue to dashboard' : 'Sign in'}
                </Button>
              </Link>
              <a
                href="https://sterlinglrs.com/about"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open About Sterling in a new tab"
              >
                <Button variant="secondary" rightIcon={<ExternalLink size={14} />}>
                  About Sterling
                </Button>
              </a>
              <Link to="/opportunities">
                <Button variant="ghost">
                  Explore Opportunities
                </Button>
              </Link>
            </div>
          </div>

          {/* Professional Imagery Grid */}
          <div className="relative grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
                alt="Professional candidate collaborating"
                className="w-full h-56 object-cover rounded-2xl shadow-card"
              />
              <div className="p-4 rounded-xl bg-white border border-[#e4eaf0] shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#087b63] font-bold text-xs">
                  <Award size={14} />
                  <span>100% Free Core Connect</span>
                </div>
                <p className="text-[11px] text-[#627086]">
                  Diagnostic readiness and scholarship discovery are always completely free.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="p-4 rounded-xl bg-[#102641] text-white shadow-card space-y-1">
                <div className="flex items-center gap-1.5 text-[#a8f0d9] font-bold text-xs">
                  <Globe2 size={14} />
                  <span>Global Reach</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Fully funded scholarships and top tier graduate programmes worldwide.
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                alt="Graduate celebrating academic success"
                className="w-full h-56 object-cover rounded-2xl shadow-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Mission & Pillars */}
      <section className="px-6 sm:px-12 py-16 sm:py-20 bg-white border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
              OUR THREE PILLARS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#102641] font-brand tracking-tight">
              A transparent, evidence-based pathway to progress
            </h2>
            <p className="text-sm text-[#627086] leading-relaxed">
              We replace guesswork and generic portals with structured preparation and verified listings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-2xl bg-[#f8fafb] border border-[#e4eaf0] space-y-4 hover:border-[#bddbd1] hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 grid place-items-center">
                <Target size={24} />
              </div>
              <h3 className="font-brand font-bold text-lg text-[#102641]">
                Universal Readiness Diagnostic
              </h3>
              <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
                Benchmark your strengths across 10 vital domains covering academic qualification, leadership narrative, references, and interview aptitude before committing to formal applications.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-2xl bg-[#f8fafb] border border-[#e4eaf0] space-y-4 hover:border-[#bddbd1] hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#e3f4ed] text-[#087b63] grid place-items-center">
                <GraduationCap size={24} />
              </div>
              <h3 className="font-brand font-bold text-lg text-[#102641]">
                Targeted Capability Building
              </h3>
              <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
                Directly connect priority gap areas to tailored modules on Sterling Academy. All learning modules under Scholarship Readiness are strictly 100% free at every tier.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-2xl bg-[#f8fafb] border border-[#e4eaf0] space-y-4 hover:border-[#bddbd1] hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 grid place-items-center">
                <BriefcaseBusiness size={24} />
              </div>
              <h3 className="font-brand font-bold text-lg text-[#102641]">
                Verified Opportunity Matching
              </h3>
              <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
                Access verified scholarships, graduate leadership tracks, and employment openings. Every match provides transparent reasons and objective compatibility criteria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Integrity */}
      <section className="px-6 sm:px-12 py-16 sm:py-20 bg-[#f8fafb] border-b border-[#edf0f3]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
              GOVERNANCE &amp; ETHICS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
              Our commitment to integrity and candidate protection
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-[#526078] leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#102641] block font-bold">Independent and Verified:</strong>
                  We independently research and verify every scholarship and employer opportunity. Listings are curated solely on merit and relevance to candidates.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#102641] block font-bold">No False Promises:</strong>
                  Sterling Connect supports preparation and opportunity discovery. We do not charge placement fees, nor do we ever guarantee selection or employment awards.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#087b63] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#102641] block font-bold">Candidate-First Privacy:</strong>
                  Your personal qualifications and assessment responses belong to you. We do not sell candidate data to recruitment headhunters or marketing third parties.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#e4eaf0] shadow-sm space-y-5">
            <h3 className="font-brand font-bold text-lg text-[#102641]">
              The Sterling Solutions Ecosystem
            </h3>
            <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
              Sterling Connect operates as the candidate-facing opportunity and readiness engine within the wider Sterling Learning &amp; Research Solutions group.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <a
                href="https://learn.sterlinglrs.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Sterling Academy in a new tab"
                className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafb] flex items-center justify-between hover:border-[#087b63] transition-colors group"
              >
                <div>
                  <strong className="text-[#102641] group-hover:text-[#087b63] block font-bold transition-colors">Sterling Academy</strong>
                  <span className="text-[#627086]">Professional masterclasses, executive learning, and certifications.</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#087b63] font-mono font-bold text-[11px]">
                  <span>learn.sterlinglrs.com</span>
                  <ExternalLink size={12} />
                </div>
              </a>

              <a
                href="https://sterlinglrs.com/about"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open About Sterling in a new tab"
                className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafb] flex items-center justify-between hover:border-[#087b63] transition-colors group"
              >
                <div>
                  <strong className="text-[#102641] group-hover:text-[#087b63] block font-bold transition-colors">About Sterling</strong>
                  <span className="text-[#627086]">Corporate background, executive team, mission, and accreditation.</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#087b63] font-mono font-bold text-[11px]">
                  <span>sterlinglrs.com/about</span>
                  <ExternalLink size={12} />
                </div>
              </a>

              <div className="p-3.5 rounded-xl border border-[#bddbd1] bg-[#e3f4ed]/30 flex items-center justify-between">
                <div>
                  <strong className="text-[#102641] block font-bold">Sterling Connect</strong>
                  <span className="text-[#627086]">Readiness benchmarking, tailored matching, and application tracking.</span>
                </div>
                <span className="text-[#087b63] font-mono font-bold text-[11px]">connect.sterlinglrs.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="px-6 sm:px-12 py-16 bg-white">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#102641] to-[#1a3a60] rounded-2xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-brand tracking-tight">
            Take the first step toward your next opportunity
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create your candidate profile, benchmark your readiness score, and discover verified scholarships and roles that match your ambitions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to={isFullyVerified ? '/dashboard' : '/sign-in'}>
              <Button variant="mint" size="md">
                {isFullyVerified ? 'Continue to dashboard' : 'Sign in'}
              </Button>
            </Link>
            <Link to="/opportunities">
              <Button variant="secondary" size="md">
                Explore Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
