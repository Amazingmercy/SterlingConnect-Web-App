import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  X,
  Check,
  Copy,
  Database,
  Mail,
  Clock,
  Lock,
  ExternalLink,
  Link2,
  Save,
  Activity,
  Globe,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';

export const AdminSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Edit settings modal state (for operational schedules & session parameters)
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load settings', err);
      setErrorMsg('Failed to load system settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCopyUri = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(true);
    toast('Database connection URI copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenEdit = (section: string) => {
    setEditingSection(section);
    if (section === 'links' && data?.settings?.links) {
      setEditForm({ ...data.settings.links });
    } else if (section === 'apiEndpoints' && data?.settings?.apiEndpoints) {
      setEditForm({ ...data.settings.apiEndpoints });
    } else if (section === 'reminders' && data?.settings?.reminders) {
      setEditForm({ ...data.settings.reminders });
    } else if (section === 'security' && data?.settings?.security) {
      setEditForm({ ...data.settings.security });
    } else if (section === 'googleAnalytics' && data?.settings?.googleAnalytics) {
      setEditForm({ ...data.settings.googleAnalytics });
    }
  };

  // Section modal save
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    setIsSaving(true);
    try {
      const payload = {
        [editingSection]: editForm,
      };
      const res = await api.put('/admin/settings', payload);
      setData(res.data);
      window.dispatchEvent(new CustomEvent('sterling_settings_updated'));
      toast('Configuration parameters updated successfully.');
      setEditingSection(null);
    } catch (err: any) {
      toast('Failed to save settings changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Global "Save settings" header action
  const handleSaveAllSettings = async () => {
    if (!data?.settings) return;
    setIsSavingGlobal(true);
    try {
      const payload = {
        links: data.settings.links,
        apiEndpoints: data.settings.apiEndpoints,
        reminders: data.settings.reminders,
        security: data.settings.security,
        googleAnalytics: data.settings.googleAnalytics,
      };
      const res = await api.put('/admin/settings', payload);
      setData(res.data);
      window.dispatchEvent(new CustomEvent('sterling_settings_updated'));
      toast('System settings saved successfully.');
    } catch (err: any) {
      toast('Failed to save system settings.', 'error');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // Screen A15 "Test connection" action
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/admin/settings/test-connection');
      setTestResult({
        success: true,
        message: res.data?.message || 'All system and integration connections healthy.',
      });
      toast('Connection test passed successfully.', 'success');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Connection failed. Check the configuration and try again. Secrets must not be shown in the interface.';
      setTestResult({
        success: false,
        message: msg,
      });
      toast(msg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (Exact Screen A15: Save settings | Test connection) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#087b63]">
            System Administration
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 tracking-tight">
            System settings and integrations
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Configure approved links, reminders and integration settings. Secrets must not be shown in the interface.
          </p>
        </div>

        {/* Action Buttons: Save settings | Test connection */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isTesting}
            disabled={isTesting || isLoading}
            leftIcon={!isTesting ? <Activity size={13} className="text-blue-600" /> : undefined}
          >
            {isTesting ? 'Testing...' : 'Test connection'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAllSettings}
            isLoading={isSavingGlobal}
            disabled={isSavingGlobal || isLoading}
            leftIcon={!isSavingGlobal ? <Save size={13} /> : undefined}
          >
            {isSavingGlobal ? 'Saving...' : 'Save settings'}
          </Button>

          <button
            onClick={fetchSettings}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh settings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Purpose & Configuration Policy Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#087b63] flex-shrink-0" />
          <strong className="text-slate-900 font-bold text-xs">
            System Administration &amp; Dynamic Runtime Settings
          </strong>
        </div>
        <p className="text-[11px] text-slate-600">
          This page manages platform runtime configurations stored directly in the database with automatic fallback to server environment defaults:
        </p>
        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
          <li>
            <strong>External API Endpoints &amp; Feeds:</strong> Course catalog, course prices, and opportunities sync URLs can be updated directly below. Changes take effect across recommendations and automated imports in real-time.
          </li>
          <li>
            <strong>Approved Platform Links:</strong> Outbound destinations for Sterling Academy, corporate portal, support email, and legal routes.
          </li>
          <li>
            <strong>Operational Schedules &amp; Reminders:</strong> Automated advance notice windows (days before deadline) and candidate application reminder stages.
          </li>
          <li>
            <strong>Telemetry &amp; Security:</strong> Google Analytics 4 measurement streams and daily diagnostic assessment retake quotas.
          </li>
        </ul>
      </div>

      {/* Test Connection Result Alert */}
      {testResult && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{testResult.message}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Settings Grid */}
      {data?.settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Card 1: Approved Platform Links (Screen A15) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#087b63]" /> Approved Platform Links
              </h3>
              <button
                type="button"
                onClick={() => handleOpenEdit('links')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" /> Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sterling Academy URL</span>
                <a
                  href={data.settings.links?.academyUrl || 'https://learn.sterlinglrs.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#087b63] hover:underline font-semibold flex items-center gap-1 truncate max-w-[220px]"
                >
                  <span className="truncate">{data.settings.links?.academyUrl || 'https://learn.sterlinglrs.com'}</span>
                  <ExternalLink size={11} className="flex-shrink-0" />
                </a>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Corporate Portal URL</span>
                <a
                  href={data.settings.links?.corporateUrl || 'https://sterlinglrs.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#087b63] hover:underline font-semibold flex items-center gap-1 truncate max-w-[220px]"
                >
                  <span className="truncate">{data.settings.links?.corporateUrl || 'https://sterlinglrs.com'}</span>
                  <ExternalLink size={11} className="flex-shrink-0" />
                </a>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Privacy Notice Route</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.links?.privacyNoticeUrl || '/privacy'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Terms of Use Route</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.links?.termsUrl || '/terms'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Candidate Support Email</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.links?.supportEmail || 'support@sterlingconnect.org'}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Approved outbound destinations and system email touchpoints.
            </p>
          </div>

          {/* Card 2: Automated Deadline Reminders (Screen A15) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" /> Automated Deadline Reminders
              </h3>
              <button
                type="button"
                onClick={() => handleOpenEdit('reminders')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" /> Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cron Schedule</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.reminders?.cronSchedule}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Advance Notice Window</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {data.settings.reminders?.advanceNoticeDays} days before deadline
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Candidate Target Stages</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.reminders?.targetStatus}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Service Reminders Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  <CheckCircle2 size={12} /> Active (Respects user preference)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Automated reminders only trigger for candidates who have enabled service reminders.
            </p>
          </div>

          {/* Card 3: Security & Session Parameters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" /> Session Tokens &amp; Security
              </h3>
              <button
                type="button"
                onClick={() => handleOpenEdit('security')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" /> Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Access Token TTL</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.security?.accessTokenTtl}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Refresh Token TTL</span>
                <span className="font-mono text-slate-800 font-semibold">{data.settings.security?.refreshTokenTtl}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Diagnostic Retake Quota</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {data.settings.security?.maxAssessmentAttemptsPerDay} per day
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Controls candidate authentication longevity and rate limits on readiness diagnostic retakes.
            </p>
          </div>

          {/* Card: External API Endpoints & Feeds */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#087b63]" /> External API Endpoints &amp; Feeds
              </h3>
              <button
                type="button"
                onClick={() => handleOpenEdit('apiEndpoints')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" /> Edit
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Course Catalog API</span>
                <span
                  className="font-mono text-[#087b63] font-semibold truncate max-w-[220px]"
                  title={data.settings.apiEndpoints?.coursesApiUrl}
                >
                  {data.settings.apiEndpoints?.coursesApiUrl || 'Default Tutor LMS'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Course Prices API</span>
                <span
                  className="font-mono text-slate-800 font-semibold truncate max-w-[220px]"
                  title={data.settings.apiEndpoints?.coursePricesApiUrl || 'None'}
                >
                  {data.settings.apiEndpoints?.coursePricesApiUrl || '(Using course item price)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Opportunities Sync API</span>
                <span
                  className="font-mono text-[#087b63] font-semibold truncate max-w-[220px]"
                  title={data.settings.apiEndpoints?.opportunitiesApiUrl}
                >
                  {data.settings.apiEndpoints?.opportunitiesApiUrl || 'Default Tutor Opportunities'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Live endpoints for automated course recommendations and opportunity catalog synchronization.
            </p>
          </div>

          {/* Card: Google Analytics 4 (GA4) Integration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 md:col-span-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Google Analytics 4 (GA4)
              </h3>
              <button
                type="button"
                onClick={() => handleOpenEdit('googleAnalytics')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-0.5">
                <span className="text-slate-500 block text-[11px]">Measurement ID</span>
                <span className="font-mono text-slate-800 font-bold block text-xs">
                  {data.settings.googleAnalytics?.measurementId || 'G-8V6ZJ2E9X1'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 block text-[11px]">Stream Name</span>
                <span className="text-slate-800 font-medium truncate block text-xs">
                  {data.settings.googleAnalytics?.streamName || 'SterlingConnect Production Web'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 block text-[11px]">Telemetry Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  <CheckCircle2 size={12} /> Active &amp; Dispatching
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Production telemetry stream for funnel drop-offs and candidate event capture.
            </p>
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 capitalize">
                  Edit{' '}
                  {editingSection === 'links'
                    ? 'Approved Platform Links'
                    : editingSection === 'apiEndpoints'
                    ? 'External API Endpoints & Feeds'
                    : editingSection === 'reminders'
                    ? 'Deadline Reminders'
                    : editingSection === 'googleAnalytics'
                    ? 'Google Analytics 4'
                    : 'Security Parameters'}
                </h3>
                <p className="text-xs text-gray-500">
                  Update runtime configuration parameters. Changes take effect across the platform immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {editingSection === 'links' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sterling Academy URL
                    </label>
                    <input
                      type="url"
                      required
                      value={editForm.academyUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, academyUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Portal URL
                    </label>
                    <input
                      type="url"
                      required
                      value={editForm.corporateUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, corporateUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Privacy Notice Route
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.privacyNoticeUrl || '/privacy'}
                        onChange={(e) => setEditForm({ ...editForm, privacyNoticeUrl: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Terms Route
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.termsUrl || '/terms'}
                        onChange={(e) => setEditForm({ ...editForm, termsUrl: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Candidate Support Email
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.supportEmail || ''}
                      onChange={(e) => setEditForm({ ...editForm, supportEmail: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {editingSection === 'apiEndpoints' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Course Catalog API URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://sterlinglrs.com/wp-json/tutor/v1/courses"
                      value={editForm.coursesApiUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, coursesApiUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      External endpoint providing recommended courses. Falls back to STERLING_COURSES_API_URL in .env if left blank.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Course Prices API URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://sterlinglrs.com/wp-json/..."
                      value={editForm.coursePricesApiUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, coursePricesApiUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Optional pricing feed. If blank, prices are extracted directly from the course item feed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Opportunities Sync API URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://sterlinglrs.com/wp-json/tutor/v1/opportunities"
                      value={editForm.opportunitiesApiUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, opportunitiesApiUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      External endpoint used by automated opportunity population and "Sync from API".
                    </p>
                  </div>
                </>
              )}

              {editingSection === 'reminders' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cron Schedule Expression
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.cronSchedule || ''}
                      onChange={(e) => setEditForm({ ...editForm, cronSchedule: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Standard crontab format, e.g. <code>0 9 * * *</code> for daily at 9:00 AM UTC.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Advance Notice Window (Days Before Deadline)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={editForm.advanceNoticeDays || 7}
                      onChange={(e) => setEditForm({ ...editForm, advanceNoticeDays: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Candidate Target Application Stages
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.targetStatus || 'SAVED, PREPARING'}
                      onChange={(e) => setEditForm({ ...editForm, targetStatus: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}

              {editingSection === 'security' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Access Token TTL
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.accessTokenTtl || '15m'}
                        onChange={(e) => setEditForm({ ...editForm, accessTokenTtl: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Refresh Token TTL
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.refreshTokenTtl || '7d'}
                        onChange={(e) => setEditForm({ ...editForm, refreshTokenTtl: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Diagnostic Retake Quota (per day)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      value={editForm.maxAssessmentAttemptsPerDay || 5}
                      onChange={(e) =>
                        setEditForm({ ...editForm, maxAssessmentAttemptsPerDay: Number(e.target.value) })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {editingSection === 'googleAnalytics' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Measurement ID (e.g. G-XXXXXXXXXX)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="G-8V6ZJ2E9X1"
                      value={editForm.measurementId || ''}
                      onChange={(e) => setEditForm({ ...editForm, measurementId: e.target.value.trim() })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stream Name
                    </label>
                    <input
                      type="text"
                      placeholder="SterlingConnect Production Web"
                      value={editForm.streamName || ''}
                      onChange={(e) => setEditForm({ ...editForm, streamName: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GA4 Property ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="438910291"
                      value={editForm.propertyId || ''}
                      onChange={(e) => setEditForm({ ...editForm, propertyId: e.target.value.trim() })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="gaSettingModalEnabled"
                      checked={editForm.enabled !== false}
                      onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                      className="rounded border-slate-300 text-sterling-navy focus:ring-sterling-navy"
                    />
                    <label htmlFor="gaSettingModalEnabled" className="text-xs text-slate-700 font-medium">
                      Enable Google Analytics event tracking on production web application
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  disabled={isSaving}
                  leftIcon={!isSaving ? <Check size={14} /> : undefined}
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};