import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, forgotPassword } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const isSessionExpired = location.search.includes('expired=true') || Boolean(location.state?.sessionExpired);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(isSessionExpired ? 'Your session has ended. Sign in again to continue.' : '');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Complete this field to continue.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Complete this field to continue.');
      hasError = true;
    }

    if (hasError) {
      setError('Please check the highlighted fields and try again.');
      return;
    }

    setIsLoading(true);
    const res = await login({ email, password });
    setIsLoading(false);

    if (res.success) {
      if (!res.user?.isEmailVerified) {
        navigate('/verify-email');
        return;
      }
      toast('Signed in successfully!');
      navigate('/dashboard');
    } else {
      setError('We couldn’t sign you in with those details. Check your email and password.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsResetSubmitting(true);
    await forgotPassword(resetEmail);
    setIsResetSubmitting(false);
    setResetSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-[460px] bg-white border border-[#e2e7f0] rounded-2xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-5">
        

        {/* Headings - Exact Copy */}
        <div className="space-y-1">
          <h1 className="font-brand font-extrabold text-[24px] sm:text-[22px] tracking-[-1px] text-[#112440]">
            Welcome back to Sterling Connect
          </h1>
          <p className="text-[13px] text-[#627086]">
            Return to your readiness, opportunities and application progress.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            error={emailError}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[#102641] tracking-tight">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  setResetEmail('');
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] font-bold text-[#087b63] hover:underline cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[13px] text-[#627086] hover:text-[#102641] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full justify-center text-[13px] py-3.5 font-bold"
              rightIcon={<ArrowRight size={14} />}
            >
              Sign in
            </Button>
          </div>
        </form>

        {/* Foot - Exact Copy */}
        <div className="pt-4 border-t border-[#edf0f3] text-center text-[12px] text-[#627086] space-y-2">
          <div>
            New to Sterling Connect?{' '}
            <Link to="/register" className="font-bold text-[#087b63] hover:underline">
              Create an account.
            </Link>
          </div>

          {/* Academy Note - Exact Copy */}
          <div className="text-[11px] text-[#627086]">
            Sterling Academy may ask you to sign in separately.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (Reset Request Form) */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset your password"
        description="Enter your account email address and we’ll send you a reset link."
      >
        {resetSent ? (
          <div className="py-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto grid place-items-center">
              <CheckCircle2 size={22} />
            </div>
            <p className="text-[12px] text-[#526078] leading-relaxed">
              If an account exists for this email address, we’ll send a password reset link.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4 pt-2">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            <div className="text-[11px] text-[#627086]">
              Sterling Academy may ask you to sign in separately.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isResetSubmitting}
              >
                Send reset link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
