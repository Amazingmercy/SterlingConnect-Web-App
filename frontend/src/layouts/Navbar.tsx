import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Bell,
  Compass,
  BriefcaseBusiness,
  Bookmark,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Lightbulb,
  UserRound,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { BrandLogo } from '../components/ui/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Close mobile menu whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = () => {
    logout();
    navigate('/sign-in');
  };

  const publicNavLinks = [
    { label: 'Opportunities', path: '/opportunities', isExternal: false },
    { label: 'Readiness Assessment', path: '/assessment', isExternal: false },
    { label: 'Sterling Academy', path: 'https://learn.sterlinglrs.com', isExternal: true },
    { label: 'About Sterling', path: 'https://sterlinglrs.com/about', isExternal: true },
  ];

  const candidateNavLinks = [
    { label: 'Get Started', path: '/dashboard', icon: Compass },
    { label: 'Opportunities', path: '/opportunities', icon: BriefcaseBusiness },
    { label: 'Saved Opportunities', path: '/saved', icon: Bookmark },
    { label: 'Readiness Assessment', path: '/assessment', icon: ClipboardCheck },
    { label: 'My Action Plan', path: '/action-plan', icon: ClipboardList },
    { label: 'My Applications', path: '/applications', icon: FileText },
    { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { label: 'Candidate Profile', path: '/profile', icon: UserRound },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings & Preferences', path: '/settings', icon: SlidersHorizontal },
  ];

  const isActive = (path: string) => location.pathname === path;
  const firstName = user?.firstName || 'Candidate';
  const lastName = user?.lastName || '';
  const avatarInitial = (firstName[0] || 'C').toUpperCase();

  const isFullyVerified = isAuthenticated && Boolean(user?.isEmailVerified);
  const isPublicPage = ['/', '/about', '/terms', '/privacy'].includes(location.pathname);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#edf0f3] h-[64px] sm:h-[70px] md:h-[76px] px-4 sm:px-6 md:px-[max(5vw,24px)] flex items-center justify-between">
        <div className="w-full flex items-center justify-between gap-3">
          {/* Brand Wordmark: SterlingConnect */}
          <Link
            to={isPublicPage ? '/' : isFullyVerified ? '/dashboard' : '/'}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#90cfc0] rounded-md transition-opacity hover:opacity-95 flex-shrink-0"
            aria-label="Sterling Connect Home"
          >
            <BrandLogo size="md" animated={true} withConnect={true} />
          </Link>

          {/* Public Desktop Nav Links (Visible when logged out OR on public landing/informational pages) */}
          {(!isFullyVerified || isPublicPage) && (
            <nav className="hidden md:flex items-center gap-[20px] lg:gap-[28px]">
              {publicNavLinks.map((link) =>
                link.isExternal ? (
                  <a
                    key={link.label}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${link.label} in a new tab`}
                    className="text-[13px] font-semibold text-[#42516a] hover:text-[#087b63] transition-colors duration-150 inline-flex items-center gap-1"
                  >
                    <span>{link.label}</span>
                    <ExternalLink size={12} className="text-[#627086]" />
                  </a>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-[13px] font-semibold transition-colors duration-150 ${
                      isActive(link.path)
                        ? 'text-[#087b63]'
                        : 'text-[#42516a] hover:text-[#087b63]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          )}

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Case 1: Signed In & Verified Candidate */}
            {isFullyVerified && user ? (
              <>
                {/* Notifications Bell - Always Visible & Tap-Friendly (44x44 target on touch) */}
                <Link
                  to="/notifications"
                  className="relative w-10 h-10 rounded-xl text-[#526078] hover:text-[#102641] hover:bg-slate-50 border border-[#e4eaf0] transition-colors flex items-center justify-center cursor-pointer"
                  title="Notifications Centre"
                  aria-label={`Notifications, ${unreadCount} unread`}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#087b63] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Desktop Profile Pill (Hidden on mobile, accessible via drawer) */}
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] hover:border-[#bddbd1] hover:bg-white transition-all shadow-2xs group"
                  title="View candidate profile"
                >
                  <div className="w-8 h-8 rounded-full bg-[#102641] text-white flex items-center justify-center font-brand font-bold text-xs shadow-xs flex-shrink-0 group-hover:bg-[#087b63] transition-colors">
                    {avatarInitial}
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-[#102641] leading-tight group-hover:text-[#087b63] transition-colors truncate max-w-[120px]">
                      {firstName}
                    </span>
                    <span className="text-[10px] text-[#627086] leading-tight truncate max-w-[140px]">
                      {user.email || 'candidate@sterling.org'}
                    </span>
                  </div>
                </Link>

                {/* Desktop Sign Out Button */}
                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="hidden md:inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold text-[#627086] hover:text-red-600 hover:bg-red-50/60 border border-[#e4eaf0] transition-colors cursor-pointer"
                  title="Sign out of Sterling Connect"
                >
                  <span>Sign out</span>
                </button>

                {/* Mobile Menu Hamburger / Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-10 h-10 md:hidden rounded-xl border border-[#e4eaf0] bg-white text-[#102641] flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
                  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : isAuthenticated && user ? (
              /* Case 2: Signed In BUT Unverified */
              <>
                <Link
                  to="/verify-email"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Verify Email</span>
                </Link>

                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#627086] hover:text-red-600 hover:bg-red-50/60 border border-[#e4eaf0] transition-colors cursor-pointer"
                >
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              /* Case 3: Public Visitor */
              <>
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/sign-in"
                    className="text-xs font-bold text-[#42516a] hover:text-[#087b63] transition-colors px-2 py-1"
                  >
                    Sign in
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={14} />}>
                      Get started
                    </Button>
                  </Link>
                </div>

                {/* Mobile Hamburger Toggle for Public Visitors */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-10 h-10 md:hidden rounded-xl border border-[#e4eaf0] bg-white text-[#102641] flex items-center justify-center hover:bg-slate-50 transition cursor-pointer"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Modal for Sign Out */}
      <ConfirmationModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
        title="Sign out of Sterling Connect?"
        description="You will be signed out of your current session and returned to the sign-in page."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        variant="danger"
        icon="logout"
      />

      {/* Mobile Navigation Drawer Overlay (Full-height slide-over) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-[300px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#edf0f3] flex items-center justify-between">
              <BrandLogo size="sm" withConnect={true} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-[#102641] flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {isFullyVerified && user ? (
                <>
                  {/* Candidate Profile Header Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-[#e3f4ed]/30 border border-[#e4eaf0] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#102641] text-white flex items-center justify-center font-brand font-bold text-sm shadow-xs flex-shrink-0">
                        {avatarInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#102641] truncate">
                          {firstName} {lastName}
                        </div>
                        <div className="text-[11px] text-[#627086] truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-bold text-[#087b63] hover:underline flex-shrink-0"
                    >
                      Profile
                    </Link>
                  </div>

                  {/* Role Switcher if Admin */}
                  {isAdmin && (
                    <div className="pt-1">
                      <Link
                        to={isAdminRoute ? '/dashboard' : '/admin'}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                          isAdminRoute
                            ? 'bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]'
                            : 'bg-[#102641] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} />
                          <span>{isAdminRoute ? 'Switch to Candidate View' : 'Switch to Admin Console'}</span>
                        </div>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="space-y-1 pt-1">
                    <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#087b63]">
                      Candidate Workspace
                    </div>
                    {candidateNavLinks.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            active
                              ? 'bg-[#e3f4ed] text-[#087b63] shadow-xs'
                              : 'text-[#42516a] hover:bg-slate-50 hover:text-[#102641]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={17} className={active ? 'text-[#087b63]' : 'text-[#627086]'} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#087b63] text-white font-extrabold">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Public Visitor Drawer */
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#087b63]">
                    Explore
                  </div>
                  {publicNavLinks.map((link) =>
                    link.isExternal ? (
                      <a
                        key={link.label}
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#42516a] hover:bg-slate-50"
                      >
                        <span>{link.label}</span>
                        <ExternalLink size={14} className="text-[#627086]" />
                      </a>
                    ) : (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                          isActive(link.path)
                            ? 'bg-[#e3f4ed] text-[#087b63]'
                            : 'text-[#42516a] hover:bg-slate-50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              )}

              {/* Informational & External Links */}
              <div className="pt-3 border-t border-[#edf0f3] flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#627086] px-2">
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#087b63]">
                  About
                </Link>
                <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#087b63]">
                  Terms of Use
                </Link>
                <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#087b63]">
                  Privacy Notice
                </Link>
                <a
                  href="https://learn.sterlinglrs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#087b63] inline-flex items-center gap-1"
                >
                  <span>Academy</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#edf0f3] bg-slate-50">
              {isFullyVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsSignOutModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign out of Connect</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full justify-center" size="md">
                      Get started
                    </Button>
                  </Link>
                  <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full justify-center" size="md">
                      Sign in
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};