import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { LoadingState } from '../../components/ui/LoadingState';

export const AdminLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Getting things ready…" className="min-h-[60vh]" />;
  }

  // A01 Access check & state copy
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Admin sign in</h1>
        <p className="text-gray-600 mb-6 font-medium">
          You don’t have access to this page.
        </p>
        <Link
          to="/signin"
          className="inline-flex items-center px-5 py-2.5 bg-[#102641] text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-5 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Dynamic Nested Content */}
        <Outlet />
      </div>
    </div>
  );
};
