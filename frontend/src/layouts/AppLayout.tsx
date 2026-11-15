import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SideNav } from './SideNav';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Email verification is mandatory: User MUST be verified before unlocking logged-in screens & sidebar
  const isFullyVerified = isAuthenticated && Boolean(user?.isEmailVerified);
  
  // Public screens must never display the internal candidate workspace sidebar or hide the footer:
  const isPublicScreen = [
    '/',
    '/about',
    '/terms',
    '/privacy',
    '/signin',
    '/sign-in',
    '/register',
    '/verify-email',
    '/reset-password',
    '/pathway',
    '/onboarding/pathways',
  ].includes(location.pathname);

  const showLoggedInLayout = isFullyVerified && !isPublicScreen;

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafb] text-[#10223c] font-sans antialiased">
      {isOffline && (
        <div
          role="alert"
          className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0"
        >
          <WifiOff size={15} />
          <span>You appear to be offline. Reconnect before saving your changes.</span>
        </div>
      )}
      <Navbar />

      {showLoggedInLayout ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-76px)] w-full">
          {/* Continuous Full-Height Left Sidebar (Non-hanging) */}
          <SideNav />

          {/* Main workspace view (No footer when signed in) */}
          <main className="flex-1 min-w-0 bg-[#f8fafb] w-full overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      ) : (
        <>
          <main className="flex-1 min-w-0 bg-[#f8fafb] w-full overflow-x-hidden">
            <Outlet />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};
