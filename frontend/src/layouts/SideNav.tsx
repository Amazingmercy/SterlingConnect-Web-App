import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  BriefcaseBusiness,
  Bookmark,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Lightbulb,
  UserRound,
  SlidersHorizontal,
  ExternalLink,
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  Users,
  ShieldCheck,
  Layers,
  GitBranch,
  Tag,
  Award,
  BarChart3,
  Mail,
  MailCheck,
  UserCheck,
  Settings,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdminRoute = location.pathname.startsWith('/admin');

  const candidateNavItems = [
    { label: 'Get Started', path: '/dashboard', icon: Compass },
    { label: 'Opportunities', path: '/opportunities', icon: BriefcaseBusiness },
    { label: 'Saved Opportunities', path: '/saved', icon: Bookmark },
    { label: 'Readiness Assessment', path: '/assessment', icon: ClipboardCheck },
    { label: 'My Action Plan', path: '/action-plan', icon: ClipboardList },
    { label: 'My Applications', path: '/applications', icon: FileText },
    { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { label: 'Profile', path: '/profile', icon: UserRound },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', path: '/settings', icon: SlidersHorizontal },
  ];

  const adminNavItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true, group: 'Insights' },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, group: 'Insights' },
    { label: 'Opportunities', path: '/admin/opportunities', icon: Briefcase, group: 'Opportunities' },
    { label: 'Bulk Importer', path: '/admin/import', icon: UploadCloud, group: 'Opportunities' },
    { label: 'Application Outcomes', path: '/admin/applications', icon: Award, group: 'Candidates' },
    { label: 'User Directory', path: '/admin/users', icon: Users, group: 'Candidates' },
    { label: 'Assessments', path: '/admin/versions', icon: Layers, group: 'Readiness Engine' },
    { label: 'Rules Engine', path: '/admin/rules', icon: GitBranch, group: 'Readiness Engine' },
    { label: 'Taxonomies', path: '/admin/taxonomies', icon: Tag, group: 'Readiness Engine' },
    { label: 'Email Templates', path: '/admin/templates', icon: Mail, group: 'Communications' },
    { label: 'Delivery Logs', path: '/admin/email-logs', icon: MailCheck, group: 'Communications' },
    { label: 'Admin Access', path: '/admin/staff', icon: UserCheck, group: 'Administration' },
    { label: 'Settings', path: '/admin/settings', icon: Settings, group: 'Administration' },
    { label: 'Audit Trail', path: '/admin/audit', icon: ShieldCheck, group: 'Administration' },
  ];

  const currentNavItems = isAdmin && isAdminRoute ? adminNavItems : candidateNavItems;

  return (
    <>
      {/* Desktop Persistent Full-Height Vertical Sidebar */}
      <aside className="hidden md:flex w-[240px] lg:w-[260px] bg-white border-r border-[#e4eaf0] flex-col justify-between p-4 flex-shrink-0 h-[calc(100vh-76px)] sticky top-[76px] overflow-y-auto z-20">
        <div className="space-y-3">
          {/* Navigation Links */}
          <nav className="space-y-1">
            {isAdmin && isAdminRoute ? (
              <>
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#627086]">
                  Admin Operations Console
                </div>
                {adminNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  const prevItem = idx > 0 ? adminNavItems[idx - 1] : null;
                  const isNewGroup = !prevItem || prevItem.group !== item.group;

                  return (
                    <React.Fragment key={item.path}>
                      {isNewGroup && (
                        <div
                          className={`px-3.5 text-[9px] font-bold uppercase tracking-wider text-[#8b99a8] ${
                            idx > 0 ? 'pt-2.5 pb-1' : 'pt-1 pb-1'
                          }`}
                        >
                          {item.group}
                        </div>
                      )}
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#e3f4ed] text-[#087b63] shadow-2xs font-extrabold'
                            : 'text-[#53617d] hover:bg-slate-50 hover:text-[#102641]'
                        }`}
                      >
                        <Icon
                          size={16}
                          className={isActive ? 'text-[#087b63]' : 'text-[#627086]'}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </>
            ) : (
              <>
                {isAdmin && (
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#627086]">
                    Candidate Workspace
                  </div>
                )}
                {candidateNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === '/assessment' && location.pathname.startsWith('/assessment')) ||
                    (item.path === '/opportunities' && location.pathname.startsWith('/opportunities'));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#e3f4ed] text-[#087b63] shadow-2xs font-extrabold'
                          : 'text-[#53617d] hover:bg-slate-50 hover:text-[#102641]'
                      }`}
                    >
                      <Icon
                        size={17}
                        className={isActive ? 'text-[#087b63]' : 'text-[#627086]'}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#087b63] text-white font-extrabold leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Single "Use as Candidate" / "Use as Admin" Link at bottom of menu */}
          {isAdmin && (
            <div className="pt-2">
              {isAdminRoute ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#e3f4ed] text-[#087b63] text-xs font-bold hover:bg-[#d5eee5] transition shadow-2xs group border border-[#c3e6da]"
                  title="Switch to Candidate View to browse, assess or apply for yourself"
                >
                  <div className="flex items-center gap-2">
                    <UserRound size={15} />
                    <span>Use as Candidate</span>
                  </div>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#102641] text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs group"
                  title="Open Admin Console"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#90cfc0]" />
                    <span>Use as Admin</span>
                  </div>
                  <ArrowRight size={13} className="text-[#90cfc0] transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* External Resources */}
        <div className="pt-3 border-t border-[#edf0f3] space-y-1">
          <a
            href="https://learn.sterlinglrs.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Sterling Academy in a new tab"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-[#53617d] hover:bg-slate-50 hover:text-[#102641] transition-colors"
          >
            <span>Sterling Academy</span>
            <ExternalLink size={13} className="text-[#627086]" />
          </a>
          <a
            href="https://sterlinglrs.com/about"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open About Sterling in a new tab"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-[#53617d] hover:bg-slate-50 hover:text-[#102641] transition-colors"
          >
            <span>About Sterling</span>
            <ExternalLink size={13} className="text-[#627086]" />
          </a>
        </div>
      </aside>

      {/* Mobile Horizontal Sub-Navigation Bar */}
      <div className="md:hidden w-full bg-white border-b border-[#e4eaf0] px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sticky top-[64px] sm:top-[70px] z-30 touch-pan-x overscroll-x-contain">
        {isAdmin && (
          <Link
            to={isAdminRoute ? '/dashboard' : '/admin'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#102641] text-white whitespace-nowrap flex-shrink-0 shadow-2xs"
          >
            {isAdminRoute ? 'Use as Candidate' : 'Use as Admin'}
          </Link>
        )}
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-[#102641] text-white shadow-2xs'
                  : 'bg-slate-50 text-[#627086] hover:bg-slate-100 hover:text-[#102641]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-[#627086]'} />
              <span>{item.label}</span>
              {(item as any).badge !== undefined && (item as any).badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#087b63] text-white font-extrabold leading-none">
                  {(item as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
};
