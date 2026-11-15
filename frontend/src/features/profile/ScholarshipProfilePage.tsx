import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  ArrowRight,
} from 'lucide-react';
import { ScholarshipPreferencesSection } from './ScholarshipPreferencesSection';
import { Button } from '../../components/ui/Button';

export const ScholarshipProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Profile Pathway Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#edf0f3]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Link
            to="/profile/common"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#627086] hover:text-[#102641] hover:bg-slate-100 flex items-center gap-2 shrink-0"
          >
            <UserRound size={15} />
            <span>Common profile</span>
          </Link>
          <Link
            to="/profile/career"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#627086] hover:text-[#102641] hover:bg-slate-100 flex items-center gap-2 shrink-0"
          >
            <BriefcaseBusiness size={15} />
            <span>Career profile</span>
          </Link>
          <Link
            to="/profile/scholarships"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#102641] text-white shadow-xs flex items-center gap-2 shrink-0"
          >
            <GraduationCap size={15} />
            <span>Scholarship profile</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/opportunities">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Explore Scholarships
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Form Content */}
      <ScholarshipPreferencesSection
        standalone={true}
        onSaved={() => navigate('/assessment')}
      />
    </div>
  );
};
