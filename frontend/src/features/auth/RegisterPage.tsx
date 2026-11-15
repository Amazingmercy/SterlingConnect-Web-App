import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { trackUserRegistered } from '../../utils/analytics';

const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Rwanda',
  'Uganda',
  'Tanzania',
  'Egypt',
  'United Kingdom',
  'Canada',
  'United States',
  'Germany',
  'Other',
];

const NATIONALITIES = [
  'Nigerian',
  'Ghanaian',
  'Kenyan',
  'South African',
  'Rwandan',
  'Ugandan',
  'Tanzanian',
  'Egyptian',
  'British',
  'Canadian',
  'American',
  'Other',
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathwayParam = searchParams.get('pathway');
  const returnOpportunityId = searchParams.get('opportunity') || searchParams.get('returnUrl');

  const { isAuthenticated, register } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Nigeria',
    password: '',
    agreeToTerms: false,
    marketing: false,
  });

  const [nationalities, setNationalities] = useState<string[]>(['Nigerian']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Complete this field to continue.';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Complete this field to continue.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Complete this field to continue.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Complete this field to continue.';
    } else if (formData.password.length < 12) {
      newErrors.password = 'Use at least 12 characters. You can use a passphrase.';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Complete this field to continue.';
    }

    if (nationalities.length === 0) {
      newErrors.nationality = 'Complete this field to continue.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Please check the highlighted fields and try again.');
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    if (returnOpportunityId) {
      sessionStorage.setItem('sterling_connect_return_opportunity', returnOpportunityId);
    }

    const res = await register({
      ...formData,
      nationality: nationalities.join(', '),
      pathway: pathwayParam || undefined,
    });
    setIsLoading(false);

    if (res.success) {
      trackUserRegistered(pathwayParam || undefined, 'email');
      toast('Account created! Please verify your email.');
      navigate('/verify-email');
    } else {
      if (res.error?.toLowerCase().includes('already')) {
        setError('An account already uses this email address. Sign in or reset your password to continue.');
      } else {
        setError('We couldn’t create your account. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#f8fafb]">
      <div className="w-full max-w-2xl bg-white border border-[#e2e7f0] rounded-2xl p-5 sm:p-7 shadow-[0_12px_36px_rgba(16,25,76,0.04)] space-y-4">
        {/* Headings - Exact Copy */}
        <div className="space-y-1">
          <h1 className="font-brand font-extrabold text-xl sm:text-2xl tracking-tight text-[#112440]">
            Create your Sterling Connect account
          </h1>
          <p className="text-xs text-[#627086]">
            Start with your goal. Build your profile and take the next step.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Compact Responsive Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Row 1: First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First name"
              required
              placeholder="e.g. Samuel"
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value });
                if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: '' });
              }}
              error={fieldErrors.firstName}
            />
            <Input
              label="Last name"
              required
              placeholder="e.g. Adeyemi"
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value });
                if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: '' });
              }}
              error={fieldErrors.lastName}
            />
          </div>

          {/* Row 2: Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
              }}
              error={fieldErrors.email}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 12 characters"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
                error={fieldErrors.password}
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
          </div>

          {/* Row 3: Country of Residence & Nationality or nationalities (Multi-select) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Country of residence"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <div>
              <label className="text-[12px] font-bold text-[#102641] tracking-tight block mb-1">
                Nationality or nationalities <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[42px] p-1.5 rounded-lg border border-[#e4eaf0] bg-white">
                {nationalities.map((nat) => (
                  <span
                    key={nat}
                    className="inline-flex items-center gap-1 bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1] text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  >
                    <span>{nat}</span>
                    {nationalities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNationalities(nationalities.filter((n) => n !== nat))}
                        className="hover:text-red-600 focus:outline-none"
                        aria-label={`Remove ${nat}`}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !nationalities.includes(val)) {
                      setNationalities([...nationalities, val]);
                    }
                  }}
                  className="text-xs text-[#526078] bg-transparent border-none focus:ring-0 outline-none cursor-pointer py-1"
                  aria-label="Add additional nationality"
                >
                  <option value="">+ Add nationality</option>
                  {NATIONALITIES.filter((n) => !nationalities.includes(n)).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.nationality && (
                <p className="text-[11px] font-medium text-red-600 mt-1">{fieldErrors.nationality}</p>
              )}
            </div>
          </div>

          {/* Row 4: Terms & Marketing Checkboxes */}
          <div className="space-y-1.5 pt-0.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={formData.agreeToTerms}
                onChange={(e) => {
                  setFormData({ ...formData, agreeToTerms: e.target.checked });
                  if (fieldErrors.agreeToTerms) setFieldErrors({ ...fieldErrors, agreeToTerms: '' });
                }}
                className="mt-0.5 rounded border-[#e4eaf0] text-[#087b63] focus:ring-[#90cfc0]"
              />
              <span className="text-[11px] text-[#526078] leading-tight">
                I agree to the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  aria-label="Open Terms of Use in a new tab"
                  className="text-[#087b63] font-bold underline"
                >
                  Terms of Use
                </Link>{' '}
                and have read the{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  aria-label="Open Privacy Notice in a new tab"
                  className="text-[#087b63] font-bold underline"
                >
                  Privacy Notice
                </Link>
                .
              </span>
            </label>
            {fieldErrors.agreeToTerms && (
              <p className="text-[11px] font-medium text-red-600 pl-6">{fieldErrors.agreeToTerms}</p>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.marketing}
                onChange={(e) => setFormData({ ...formData, marketing: e.target.checked })}
                className="mt-0.5 rounded border-[#e4eaf0] text-[#087b63] focus:ring-[#90cfc0]"
              />
              <span className="text-[11px] text-[#526078] leading-tight">
                Send me occasional Sterling learning updates and opportunities.
              </span>
            </label>
          </div>

          {/* Row 5: Action Button & Sign in Link */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#627086] text-center sm:text-left order-2 sm:order-1">
              Already have an account?{' '}
              <Link to="/sign-in" className="font-bold text-[#087b63] hover:underline">
                Sign in.
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold justify-center order-1 sm:order-2"
              rightIcon={<ArrowRight size={14} />}
            >
              {isLoading ? 'Creating your account…' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
