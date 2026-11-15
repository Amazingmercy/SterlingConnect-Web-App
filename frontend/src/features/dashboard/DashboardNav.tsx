import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  BriefcaseBusiness,
  Bookmark,
  FileText,
  Lightbulb,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Compass },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'My Applications', path: '/applications', icon: FileText },
    { label: 'Opportunities', path: '/opportunities', icon: BriefcaseBusiness },
    { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { label: 'Profile', path: '/profile', icon: UserRound },
    { label: 'Settings', path: '/settings', icon: SlidersHorizontal },
  ];

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#e4eaf0] mb-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#102641] text-white shadow-sm'
                : 'text-[#53617d] hover:bg-[#f0edff]/60 hover:text-[#087b63]'
            }`}
          >
            <Icon size={15} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
