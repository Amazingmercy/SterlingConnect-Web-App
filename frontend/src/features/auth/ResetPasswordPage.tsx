import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { forgotPassword, resetPassword } = useAuth();

  // Request link form state
  const [email, setEmail] = useState('');
  const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  // Reset with token form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);

  // Handler for requesting a password reset link
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsRequestLoading(true);
    await forgotPassword(email.trim());
    setIsRequestLoading(false);
    setIsRequestSubmitted(true);
  };

  // Handler for setting a new password with token
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (newPassword.length < 12) {
      setValidationError('Use at least 12 characters. You can use a passphrase.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Your passwords don’t match. Please enter them again.');
      return;
    }

    setIsResetLoading(true);
    const res = await resetPassword(token || '', newPassword);
    setIsResetLoading(false);

    if (res.success) {
      setIsResetDone(true);
    } else {
      setValidationError(res.error || 'This verification link has expired or has already been used. Request a new link to continue.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-[460px] bg-white border border-[#e2e7f0] rounded-2xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-5">
        {/* Brand */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#90cfc0] rounded-md transition-opacity hover:opacity-95"
            aria-label="Sterling Connect Home"
          >
            <BrandLogo size="lg" animated={true} withConnect={true} />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-brand font-extrabold text-[24px] sm:text-[28px] tracking-[-1px] text-[#112440]">
            Reset your password
          </h1>
          {!token && !isRequestSubmitted && (
            <p className="text-[13px] text-[#627086]">
              Enter your account email address and we’ll send you a reset link.
            </p>
          )}
        </div>

        {token ? (
          /* Token State: New password & Confirm new password form */
          isResetDone ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto grid place-items-center">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-[13px] font-semibold text-[#102641]">
                Your password has been updated. Sign in to continue.
              </p>
              <div className="pt-2">
                <Link to="/sign-in">
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {validationError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed flex items-start gap-2">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="relative">
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 12 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Use at least 12 characters. You can use a passphrase."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-[33px] text-[#627086] hover:text-[#102641] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isResetLoading}
                  className="w-full justify-center text-[13px] py-3.5 font-bold"
                  rightIcon={<ArrowRight size={14} />}
                >
                  Reset password
                </Button>
              </div>
            </form>
          )
        ) : (
          /* Request Form State (No token) */
          isRequestSubmitted ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto grid place-items-center">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-[13px] text-[#526078] leading-relaxed">
                If an account exists for this email address, we’ll send a password reset link.
              </p>
              <div className="pt-2">
                <Link to="/sign-in">
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    Return to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isRequestLoading}
                  className="w-full justify-center text-[13px] py-3.5 font-bold"
                  rightIcon={<ArrowRight size={14} />}
                >
                  Send reset link
                </Button>
              </div>
            </form>
          )
        )}

        {/* Foot & Academy Note */}
        <div className="pt-4 border-t border-[#edf0f3] text-center text-[12px] text-[#627086] space-y-2">
          <div>
            Remembered your password?{' '}
            <Link to="/sign-in" className="font-bold text-[#087b63] hover:underline">
              Sign in.
            </Link>
          </div>

          <div className="text-[11px] text-[#627086]">
            Sterling Academy may ask you to sign in separately.
          </div>
        </div>
      </div>
    </div>
  );
};
