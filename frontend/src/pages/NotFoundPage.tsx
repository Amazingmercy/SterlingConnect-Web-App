import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Compass, Home, LayoutDashboard } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-[#f8fafb]">
      <div className="max-w-md w-full bg-white border border-[#e4eaf0] rounded-2xl p-8 text-center shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#f0f8f5] text-[#087b63] border border-[#bddbd1] flex items-center justify-center mx-auto">
          <Compass size={28} />
        </div>

        <div className="space-y-2">
          <h1 className="font-brand font-extrabold text-2xl text-[#102641] tracking-tight">
            We couldn’t find that page.
          </h1>
          <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
            It may have moved or no longer be available.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<LayoutDashboard size={15} />}
                className="w-full justify-center text-xs font-bold"
              >
                Go to dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Home size={15} />}
                className="w-full justify-center text-xs font-bold"
              >
                Go to Connect home
              </Button>
            </Link>
          )}

          <Link to="/opportunities" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center text-xs font-bold"
            >
              Browse opportunities
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
