import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../ui/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Getting things ready…" className="min-h-[60vh]" />;
  }

  // 1. Must be authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 2. Email verification gate: User MUST verify email before accessing ANY logged-in screen
  if (!user.isEmailVerified) {
    // If not already on /verify-email, redirect to /verify-email
    if (location.pathname !== '/verify-email') {
      return <Navigate to="/verify-email" replace />;
    }
  }

  // 3. Admin role check for admin-only routes (A01: Admin sign in & access control)
  if (requireAdmin && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-900 mb-2">Admin sign in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to Sterling Connect administration.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-sm text-red-700 font-medium">
            You don’t have access to this page.
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="/signin"
              className="inline-flex justify-center items-center px-4 py-2.5 bg-sterling-navy text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              Sign in
            </a>
            <a
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-800 underline mt-2"
            >
              Return to User Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
