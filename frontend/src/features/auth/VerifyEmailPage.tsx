import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RotateCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';

const maskEmail = (email: string) => {
  if (!email) return 'your email';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 3))}${name[name.length - 1]}@${domain}`;
};

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, verifyEmail, resendVerificationEmail } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(Boolean(user?.isEmailVerified));
  const [expiredError, setExpiredError] = useState('');
  const [resentMessage, setResentMessage] = useState('');

  const navigateToNext = () => {
    const returnOpp = sessionStorage.getItem('sterling_connect_return_opportunity');
    if (returnOpp) {
      sessionStorage.removeItem('sterling_connect_return_opportunity');
      navigate(`/opportunities/${returnOpp}`);
    } else if (user?.hasCompletedAssessment) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/onboarding/pathways', { replace: true });
    }
  };

  // If already verified on initial page load, redirect
  useEffect(() => {
    if (user?.isEmailVerified && !isVerified) {
      setIsVerified(true);
    }
  }, [user?.isEmailVerified]);

  // Check URL token query parameter for 1-click email verification
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      if (token.length === 6) {
        setOtp(token.split(''));
      }
      setIsLoading(true);
      setExpiredError('');
      verifyEmail(token).then((res) => {
        setIsLoading(false);
        if (res.success) {
          setIsVerified(true);
        } else {
          setExpiredError(
            'This verification link has expired or has already been used. Request a new link to continue.'
          );
        }
      });
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setExpiredError('');
    setResentMessage('');

    const code = otp.join('');
    const res = await verifyEmail(code);
    setIsLoading(false);

    if (res.success) {
      setIsVerified(true);
    } else {
      setExpiredError(
        'This verification link has expired or has already been used. Request a new link to continue.'
      );
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setExpiredError('');
    await resendVerificationEmail();
    setResentMessage('If your account is awaiting verification, we’ll send a new link.');
    setCountdown(60);
    setCanResend(false);
  };

  const emailDisplay = user?.email || 'your email address';

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-xl bg-white border border-[#e2e7f0] rounded-2xl p-6 sm:p-8 shadow-[0_12px_36px_rgba(16,25,76,0.04)] text-center space-y-5">
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

        {isVerified ? (
          /* Success State (U05 valid verification) */
          <div className="space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto grid place-items-center">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="font-brand font-extrabold text-[22px] sm:text-[26px] tracking-[-0.5px] text-[#112440]">
                Your email is verified. Let’s set up your profile.
              </h1>
            </div>

            <div className="pt-3">
              <Button
                variant="primary"
                size="md"
                onClick={navigateToNext}
                className="w-full justify-center text-[13px] py-3.5"
                rightIcon={<ArrowRight size={14} />}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          /* Awaiting Verification State */
          <div className="space-y-5">
            {/* Mail Icon */}
            <div className="w-16 h-16 rounded-full bg-[#e3f4ed] text-[#087b63] mx-auto grid place-items-center">
              <Mail size={32} />
            </div>

            {/* Header - Exact Copy: headline and body */}
            <div className="space-y-2">
              <h1 className="font-brand font-extrabold text-[24px] sm:text-[26px] tracking-[-1px] text-[#112440]">
                Check your email
              </h1>
              <p className="text-[13px] text-[#526078] leading-relaxed max-w-md mx-auto">
                We sent a verification link to {maskEmail(emailDisplay)}. Open it to confirm your email address and continue.
              </p>
            </div>

            {expiredError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed text-left flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600" />
                <span>{expiredError}</span>
              </div>
            )}

            {resentMessage && (
              <div className="p-3 rounded-lg bg-[#e3f4ed] border border-[#bddbd1] text-[#087b63] text-xs font-medium leading-relaxed text-left flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-[#087b63]" />
                <span>{resentMessage}</span>
              </div>
            )}

            {/* 6-Digit Verification Code Form */}
            <form onSubmit={handleVerify} className="space-y-4 pt-1">
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        document.getElementById(`otp-${idx - 1}`)?.focus();
                      }
                    }}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center font-brand font-extrabold text-lg rounded-[8px] border border-[#e4eaf0] focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px]"
                  />
                ))}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full justify-center text-[13px] py-3.5"
                  rightIcon={<ArrowRight size={14} />}
                >
                  Continue
                </Button>
              </div>
            </form>

            {/* Resend and Help Actions */}
            <div className="pt-1 text-[12px] text-[#627086] space-y-2">
              <p>
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="font-bold text-[#087b63] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw size={12} />
                    <span>Resend verification email</span>
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Resend verification email in {countdown}s
                  </span>
                )}
              </p>

              <p className="text-[11px] text-[#627086]">
                Check your spam or junk folder if the email hasn’t arrived.
              </p>

              <p className="pt-2 border-t border-[#edf0f3]">
                Wrong email?{' '}
                <Link to="/sign-in" className="font-bold text-[#087b63] hover:underline">
                  Sign in again
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
