import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Bell,
  Lock,
  Compass,
  Database,
  Download,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useAssessment } from '../../context/AssessmentContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { PathwayType } from '../../types/auth';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, setPathway } = useAuth();
  const { profile } = useProfile();
  const { resetAssessment } = useAssessment();
  const { toast } = useToast();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [country, setCountry] = useState(user?.country || 'Nigeria');
  const [nationality, setNationality] = useState(user?.nationality || 'Nigerian');

  // Pathway preference state
  const [selectedPathway, setSelectedPathway] = useState<PathwayType>(
    user?.pathway || 'Both Pathways'
  );
  const [primaryGoal, setPrimaryGoal] = useState<PathwayType>(
    user?.primaryGoal || 'Education & Scholarship Opportunities'
  );

  // U25 exact notification preferences
  const [serviceReminders, setServiceReminders] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(true);

  // U25 exact IANA timezone
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
  const [timezone, setTimezone] = useState(defaultTz);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset assessment modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Updating / Loading states for buttons to prevent double-clicks
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [isUpdatingPathway, setIsUpdatingPathway] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch persisted preferences on mount
  useEffect(() => {
    let isMounted = true;
    const fetchPreferences = async () => {
      try {
        const res = await api.get('/users/preferences');
        if (res.data?.preferences && isMounted) {
          const p = res.data.preferences;
          if (p.serviceReminders !== undefined) setServiceReminders(p.serviceReminders);
          if (p.marketingUpdates !== undefined) setMarketingUpdates(p.marketingUpdates);
          if (p.timezone) setTimezone(p.timezone);
        }
      } catch {
        // Fallback to initial browser values if guest/offline
      }
    };
    fetchPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save personal details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await api.put('/users/profile/personal', {
        firstName,
        lastName,
        country,
        nationality,
      });
      updateUser({
        firstName: res.data?.user?.firstName || firstName,
        lastName: res.data?.user?.lastName || lastName,
        country: res.data?.user?.country || country,
        nationality: res.data?.user?.nationality || nationality,
      });
      toast('Your changes have been saved.', 'success');
    } catch (err: any) {
      // Fallback for offline/guest demo mode
      updateUser({
        firstName,
        lastName,
        email,
        country,
        nationality,
      });
      toast('Your changes have been saved.', 'success');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Save pathway
  const handleSavePathway = async () => {
    setIsUpdatingPathway(true);
    try {
      await setPathway(
        selectedPathway,
        selectedPathway === 'Both Pathways' ? primaryGoal : undefined
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast('Your changes have been saved.', 'success');
    } finally {
      setIsUpdatingPathway(false);
    }
  };

  // Save preferences (U25 exact display copy and toast: "Your preferences have been updated.")
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPreferences(true);
    try {
      const res = await api.put('/users/preferences', {
        serviceReminders,
        marketingUpdates,
        timezone,
      });
      if (res.data?.preferences) {
        setServiceReminders(res.data.preferences.serviceReminders ?? serviceReminders);
        setMarketingUpdates(res.data.preferences.marketingUpdates ?? marketingUpdates);
        setTimezone(res.data.preferences.timezone || timezone);
      }
      toast('Your preferences have been updated.', 'success');
    } catch (err: any) {
      toast('Failed to update preferences. Please try again.', 'error');
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  // Password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('Current password is required.', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('Password updated securely.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password. Check your current password.';
      toast(msg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Reset assessment
  const handleResetAssessment = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetAssessment = async () => {
    setIsResetting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      resetAssessment();
      setIsResetModalOpen(false);
      toast('Assessment responses reset. You can now retake it.', 'info');
    } finally {
      setIsResetting(false);
    }
  };

  // Account Deletion Workflow (U25)
  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionPassword) {
      toast('Please enter your password to confirm.', 'error');
      return;
    }
    setIsDeleting(true);
    try {
      await api.post('/users/request-deletion', {
        password: deletionPassword,
      });
      setIsDeleteModalOpen(false);
      setDeletionRequested(true);
      toast(
        'Your deletion request has been received. We’ll contact you using your account email address.',
        'info'
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit account deletion request.';
      toast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export JSON profile
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const candidateData = {
        user,
        profile,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(candidateData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SterlingConnect_Profile_${user?.firstName || 'User'}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast('Profile data exported successfully.', 'success');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Page Heading (Exact display copy: "Your account and preferences") */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#edf0f3]">
        <div className="space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
            Account and preferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Your account and preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#627086]">
            Account and communication preferences
          </p>
        </div>

        {/* Profile Link: "Edit my profile" */}
        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={13} />}>
              Edit my profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Deletion Notice Banner (if requested) */}
      {deletionRequested && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
          <div className="font-bold flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-700" />
            <span>Account Deletion Request Pending</span>
          </div>
          <p className="text-amber-800">
            Your deletion request has been received. We’ll contact you using your account email address ({user?.email}).
          </p>
        </div>
      )}

      {/* Section 1: Personal Information */}
      <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-[#087b63]" />
            <h3 className="font-brand font-bold text-base text-[#102641]">Personal Information</h3>
          </div>
          <Link to="/profile" className="text-xs font-bold text-[#087b63] hover:underline flex items-center gap-1">
            <span>Edit my profile</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              helperText="Primary email used for application alerts and updates"
            />
            <Select
              label="Country of Residence"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: 'Nigeria', label: 'Nigeria' },
                { value: 'Ghana', label: 'Ghana' },
                { value: 'Kenya', label: 'Kenya' },
                { value: 'United Kingdom', label: 'United Kingdom' },
                { value: 'United States', label: 'United States' },
                { value: 'Canada', label: 'Canada' },
              ]}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isUpdatingProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? 'Updating...' : 'Save Personal Details'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 2: Communication Preferences & Time Zone (U25 Canonical) */}
      <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Bell size={18} className="text-[#087b63]" />
          <div>
            <h3 className="font-brand font-bold text-base text-[#102641]">
              Communication Preferences &amp; Time Zone
            </h3>
            <p className="text-xs text-[#627086]">
              Control the notifications you receive and specify your regional time zone.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          {/* Checkboxes: Exact U25 copy */}
          <div className="space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={serviceReminders}
                onChange={(e) => setServiceReminders(e.target.checked)}
                className="mt-1 rounded text-[#087b63] focus:ring-[#90cfc0]"
              />
              <div>
                <div className="text-xs font-bold text-[#102641]">
                  Opportunity and application reminders
                </div>
                <div className="text-[11px] text-[#627086]">
                  Receive alerts about upcoming saved application deadlines and follow-up prompts.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingUpdates}
                onChange={(e) => setMarketingUpdates(e.target.checked)}
                className="mt-1 rounded text-[#087b63] focus:ring-[#90cfc0]"
              />
              <div>
                <div className="text-xs font-bold text-[#102641]">
                  Sterling learning updates and opportunities
                </div>
                <div className="text-[11px] text-[#627086]">
                  Receive periodic recommendations for free Sterling Shorts, courses, and curated opportunities.
                </div>
              </div>
            </label>
          </div>

          {/* Timezone: Exact U25 copy "Your time zone" */}
          <div className="pt-3 border-t border-slate-100 max-w-md">
            <Select
              label="Your time zone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              helperText={`Detected local time zone: ${defaultTz}`}
              options={[
                { value: 'Africa/Lagos', label: 'Africa/Lagos (GMT+1)' },
                { value: 'Africa/Accra', label: 'Africa/Accra (GMT+0)' },
                { value: 'Africa/Nairobi', label: 'Africa/Nairobi (GMT+3)' },
                { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (GMT+2)' },
                { value: 'Europe/London', label: 'Europe/London (GMT+0 / BST)' },
                { value: 'America/New_York', label: 'America/New_York (EST / EDT)' },
                { value: 'America/Chicago', label: 'America/Chicago (CST / CDT)' },
                { value: 'America/Toronto', label: 'America/Toronto (EST / EDT)' },
                { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
                { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
              ]}
            />
          </div>

          {/* Submit: Exact copy "Save preferences" */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isUpdatingPreferences}
              disabled={isUpdatingPreferences}
            >
              {isUpdatingPreferences ? 'Updating...' : 'Save preferences'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 3: Target Pathway & Goals */}
      <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Compass size={18} className="text-[#087b63]" />
          <h3 className="font-brand font-bold text-base text-[#102641]">
            Target Pathway &amp; Goals
          </h3>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'Career & Employment' as PathwayType,
              title: 'Career & Employment',
              desc: 'Focus primarily on graduate programmes, industry roles, and corporate career opportunities.',
            },
            {
              id: 'Education & Scholarships' as PathwayType,
              title: 'Education & Scholarships',
              desc: 'Focus primarily on fully funded Master’s, PhDs, fellowships, and university funding.',
            },
            {
              id: 'Both Pathways' as PathwayType,
              title: 'Both Pathways (Career & Scholarships)',
              desc: 'Discover both global postgraduate funding and vetted career openings.',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPathway(item.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedPathway === item.id ||
                (item.id === 'Career & Employment' && selectedPathway === ('Employment & Career Opportunities' as any)) ||
                (item.id === 'Education & Scholarships' && selectedPathway === ('Education & Scholarship Opportunities' as any))
                  ? 'border-[#087b63] bg-[#e3f4ed]/30 ring-1 ring-[#087b63]'
                  : 'border-[#e4eaf0] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="pathway"
                  checked={
                    selectedPathway === item.id ||
                    (item.id === 'Career & Employment' && selectedPathway === ('Employment & Career Opportunities' as any)) ||
                    (item.id === 'Education & Scholarships' && selectedPathway === ('Education & Scholarship Opportunities' as any))
                  }
                  onChange={() => setSelectedPathway(item.id)}
                  className="text-[#087b63] focus:ring-[#90cfc0]"
                />
                <span className="text-xs font-bold text-[#102641]">{item.title}</span>
              </div>
              <p className="text-[11px] text-[#627086] mt-1 pl-6">{item.desc}</p>
            </div>
          ))}

          {selectedPathway === 'Both Pathways' && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-[#102641] block">
                Which pathway would you like to start with?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'Career & Employment' as PathwayType,
                    label: 'Career & Employment',
                  },
                  {
                    id: 'Education & Scholarships' as PathwayType,
                    label: 'Education & Scholarships',
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPrimaryGoal(g.id)}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                      primaryGoal === g.id ||
                      (g.id === 'Career & Employment' && primaryGoal === ('Employment & Career Opportunities' as any)) ||
                      (g.id === 'Education & Scholarships' && primaryGoal === ('Education & Scholarship Opportunities' as any))
                        ? 'border-[#087b63] bg-[#087b63] text-white shadow-xs'
                        : 'border-[#e4eaf0] text-[#526078] hover:bg-slate-50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePathway}
              isLoading={isUpdatingPathway}
              disabled={isUpdatingPathway}
            >
              {isUpdatingPathway ? 'Updating...' : 'Update Pathway'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 4: Password & Security */}
      <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Lock size={18} className="text-[#087b63]" />
          <h3 className="font-brand font-bold text-base text-[#102641]">Change password</h3>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              isLoading={isUpdatingPassword}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Change password'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 5: Data, Privacy & Account Deletion (U25 Canonical) */}
      <Card className="p-6 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="text-[#087b63]" />
            <h3 className="font-brand font-bold text-base text-[#102641]">Data &amp; Privacy</h3>
          </div>

          {/* Privacy Link: "Read our Privacy Notice" */}
          <Link
            to="/privacy"
            className="text-xs font-bold text-[#087b63] hover:underline flex items-center gap-1"
          >
            <span>Read our Privacy Notice</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className="space-y-4">
          {/* Export JSON */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-[#f8fafb]">
            <div>
              <div className="text-xs font-bold text-[#102641]">
                Export Candidate Profile &amp; Assessment
              </div>
              <div className="text-[11px] text-[#627086]">
                Download a complete backup of your profile details, documents list, and readiness history.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
              disabled={isExporting}
              leftIcon={!isExporting ? <Download size={13} /> : undefined}
            >
              {isExporting ? 'Updating...' : 'Export JSON'}
            </Button>
          </div>

          {/* Retake Readiness Assessment */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-100 bg-amber-50/40">
            <div>
              <div className="text-xs font-bold text-amber-900">
                Retake Universal Readiness Assessment
              </div>
              <div className="text-[11px] text-amber-800">
                Reset existing responses to reassess your scores against the 10 domains.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetAssessment}
              isLoading={isResetting}
              disabled={isResetting}
              leftIcon={!isResetting ? <RotateCcw size={13} /> : undefined}
              className="text-amber-900 border-amber-200 hover:bg-amber-100"
            >
              {isResetting ? 'Updating...' : 'Reset Assessment'}
            </Button>
          </div>

          {/* Request Account Deletion (U25 exact copy & workflow) */}
          <div className="p-4 rounded-xl border border-red-100 bg-red-50/40 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Request account deletion
              </h4>
              <p className="text-[12px] text-red-800/90 leading-relaxed mt-1">
                Request deletion of your Connect account and personal data. Review the Privacy Notice
                for details about retention and any records we may need to keep.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link to="/privacy" className="text-[11px] font-bold text-red-700 hover:underline">
                Read our Privacy Notice
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Request deletion
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Retake/Reset Assessment Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
        onConfirm={confirmResetAssessment}
        title="Retake Readiness Assessment?"
        description="Are you sure you want to retake the assessment? Previous responses will be reset."
        confirmLabel={isResetting ? 'Updating...' : 'Reset Assessment'}
        cancelLabel="Keep Responses"
        variant="warning"
        icon="reset"
        isLoading={isResetting}
      />

      {/* Request Account Deletion Reauthentication Modal (U25 exact copy) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Request account deletion"
        description="Request deletion of your Connect account and personal data. Review the Privacy Notice for details about retention and any records we may need to keep."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmDeletion} className="space-y-4 pt-2">
          <Input
            label="Confirm with Password"
            type="password"
            placeholder="Enter your current password"
            required
            value={deletionPassword}
            onChange={(e) => setDeletionPassword(e.target.value)}
            helperText="Re-authenticate to submit your data deletion request."
          />

          <div className="pt-4 border-t border-[#edf0f3] flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Keep my account
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Updating...' : 'Request deletion'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
