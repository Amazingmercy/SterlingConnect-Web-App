import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  Check,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  Search,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { ALL_COUNTRY_NAMES } from './data/isoCountries';
import { QUALIFICATIONS } from './data/careerTaxonomy';
import { ProfileCompletionCard } from './ProfileCompletionCard';
import type { UserUploadedDocument } from '../../types/profile';

export const ProfileBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveProfile, isSaving, profile, updateCommon, addDocument, removeDocument } = useProfile();
  const { common, documents } = profile;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [residenceSearch, setResidenceSearch] = useState('');
  const [isResidenceOpen, setIsResidenceOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [isNationalityOpen, setIsNationalityOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Current CV document from common profile or documents array
  const currentCv: UserUploadedDocument | null =
    common.cvDocument ||
    documents.find((d) => d.type === 'CV_RESUME' || d.category === 'CV / Resume' || d.category === 'CV or résumé') ||
    null;

  const isBoth = user?.pathway === 'Both Pathways' || !user?.pathway;
  const isScholarshipOnly = user?.pathway === 'Education & Scholarship Opportunities';

  // Filter countries
  const filteredResidenceCountries = ALL_COUNTRY_NAMES.filter((c) =>
    c.toLowerCase().includes(residenceSearch.toLowerCase())
  );
  const filteredNationalityCountries = ALL_COUNTRY_NAMES.filter((c) =>
    c.toLowerCase().includes(nationalitySearch.toLowerCase())
  );

  const handleSelectResidence = (country: string) => {
    updateCommon({ countryOfResidence: country });
    setIsResidenceOpen(false);
    setResidenceSearch('');
  };

  const handleAddNationality = (nat: string) => {
    const current = common.nationalities || [];
    if (!current.includes(nat)) {
      updateCommon({ nationalities: [...current, nat] });
    }
    setIsNationalityOpen(false);
    setNationalitySearch('');
  };

  const handleRemoveNationality = (nat: string) => {
    const current = common.nationalities || [];
    updateCommon({ nationalities: current.filter((n) => n !== nat) });
  };

  const validateAndProcessFile = (file: File) => {
    setUploadError(null);
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const hasValidType = validTypes.includes(file.type) || hasValidExt;
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5 MB limit per spec

    if (!hasValidType || !isValidSize) {
      setUploadError('We couldn’t upload this file. Use an accepted file type and check the size limit.');
      toast('We couldn’t upload this file. Use an accepted file type and check the size limit.', 'error');
      return;
    }

    const doc: UserUploadedDocument = {
      id: 'cv_' + Date.now(),
      name: file.name,
      label: file.name.replace(/\.[^/.]+$/, ''),
      category: 'CV or résumé',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      type: 'CV_RESUME',
    };

    updateCommon({ cvDocument: doc });
    addDocument(doc);
    toast('Your CV or résumé has been attached.', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCv = () => {
    if (currentCv) {
      removeDocument(currentCv.id);
    }
    updateCommon({ cvDocument: null });
    setUploadError(null);
    toast('CV removed.');
  };

  const handleSaveAndContinue = async () => {
    if (!navigator.onLine) {
      toast('You appear to be offline. Reconnect before saving your changes.', 'error');
      return;
    }
    await saveProfile();
    toast('Your changes have been saved.');
    if (isScholarshipOnly) {
      navigate('/profile/scholarships');
    } else {
      navigate('/profile/career');
    }
  };

  const handleSaveAndFinishLater = async () => {
    if (!navigator.onLine) {
      toast('You appear to be offline. Reconnect before saving your changes.', 'error');
      return;
    }
    await saveProfile();
    toast('Your changes have been saved.');
    navigate('/dashboard');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Profile Pathway Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#edf0f3]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Link
            to="/profile/common"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#102641] text-white shadow-xs flex items-center gap-2 shrink-0"
          >
            <UserRound size={15} />
            <span>Common profile</span>
          </Link>
          <Link
            to="/profile/career"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#627086] hover:text-[#102641] hover:bg-slate-100 flex items-center gap-2 shrink-0"
          >
            <BriefcaseBusiness size={15} />
            <span>Career profile</span>
          </Link>
          <Link
            to="/profile/scholarships"
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#627086] hover:text-[#102641] hover:bg-slate-100 flex items-center gap-2 shrink-0"
          >
            <GraduationCap size={15} />
            <span>Scholarship profile</span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/opportunities">
            <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Explore Opportunities
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* U08 Title & Intro */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e4eaf0] shadow-xs space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <h1 className="text-xl sm:text-2xl font-brand font-bold text-[#102641]">
                Tell us a little about yourself
              </h1>
              <p className="text-xs sm:text-sm text-[#627086] leading-relaxed">
                Your profile helps us suggest relevant opportunities. You can update it as your goals change.
              </p>
            </div>

            {/* Name Fields: First name | Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#102641] block">First name</label>
                <input
                  type="text"
                  value={user?.firstName || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400">From your account</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#102641] block">Last name</label>
                <input
                  type="text"
                  value={user?.lastName || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400">From your account</span>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102641] block">Email address</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <ShieldCheck size={13} />
                  <span>Verified</span>
                </span>
              </div>
              <span className="text-[11px] text-[#627086] block">
                Verified account email; change requires re-verification
              </span>
            </div>

            {/* Country of residence (Searchable country list) */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-[#102641] block">Country of residence</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsResidenceOpen(!isResidenceOpen)}
                  className="w-full h-10 px-3 text-left rounded-lg border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] hover:border-slate-400 focus:outline-none flex items-center justify-between"
                >
                  <span>{common.countryOfResidence || 'Select your country of residence'}</span>
                  <Search size={14} className="text-slate-400" />
                </button>

                {isResidenceOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={residenceSearch}
                          onChange={(e) => setResidenceSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                      {filteredResidenceCountries.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleSelectResidence(c)}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-[#e3f4ed] hover:text-[#087b63] transition-colors flex items-center justify-between ${
                            common.countryOfResidence === c ? 'font-bold text-[#087b63] bg-[#e3f4ed]/50' : 'text-slate-700'
                          }`}
                        >
                          <span>{c}</span>
                          {common.countryOfResidence === c && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nationality or nationalities (Multi-select ISO country list) */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-[#102641] block">
                Nationality or nationalities
              </label>

              {/* Selected Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-1.5 border border-[#e4eaf0] rounded-lg bg-white">
                {(common.nationalities || []).map((nat) => (
                  <span
                    key={nat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#f2f4f9] text-[#102641] border border-[#e4eaf0]"
                  >
                    <span>{nat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNationality(nat)}
                      className="hover:text-red-600 transition cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => setIsNationalityOpen(!isNationalityOpen)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition flex items-center gap-1"
                >
                  <Search size={12} />
                  <span>+ Add nationality</span>
                </button>
              </div>

              {isNationalityOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search nationality..."
                        value={nationalitySearch}
                        onChange={(e) => setNationalitySearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                    {filteredNationalityCountries.map((c) => {
                      const isSelected = (common.nationalities || []).includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveNationality(c) : handleAddNationality(c))}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-[#e3f4ed] hover:text-[#087b63] transition-colors flex items-center justify-between ${
                            isSelected ? 'font-bold text-[#087b63] bg-[#e3f4ed]/50' : 'text-slate-700'
                          }`}
                        >
                          <span>{c}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Highest completed qualification (Dropdown with exact labels) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102641] block">
                Highest completed qualification
              </label>
              <select
                value={common.highestQualification || 'Bachelor’s degree'}
                onChange={(e) => updateCommon({ highestQualification: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
              >
                {QUALIFICATIONS.map((q) => (
                  <option key={q.key} value={q.label}>
                    {q.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#627086] block">
                Choose a qualification you have already completed.
              </span>
            </div>

            {/* CV or résumé (Optional private file upload, up to 5 MB) */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#102641] block">CV or résumé</label>
              <p className="text-[11px] text-[#627086]">
                Optional. Upload a PDF or Word document, up to 5 MB.
              </p>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {currentCv ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2.5 rounded-lg bg-emerald-600 text-white shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentCv.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatFileSize(currentCv.size)} • Uploaded {new Date(currentCv.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCv}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition cursor-pointer"
                    title="Remove CV"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) validateAndProcessFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#087b63] bg-[#e3f4ed]/30'
                      : 'border-[#ced7e0] bg-[#fbfcfd] hover:bg-white hover:border-[#087b63]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <UploadCloud size={28} className="mx-auto text-[#087b63] mb-2" />
                  <div className="text-xs font-bold text-[#102641]">
                    Click to upload or drag and drop your CV or résumé
                  </div>
                  <div className="text-[11px] text-[#627086] mt-1">
                    PDF, DOC, DOCX up to 5 MB
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <div className="pt-6 border-t border-[#edf0f3] flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSaving}
                onClick={handleSaveAndContinue}
                rightIcon={<ArrowRight size={15} />}
              >
                Save and continue
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ProfileCompletionCard />

          <div className="p-5 rounded-2xl bg-[#f8fafb] border border-[#e4eaf0] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#102641]">
              Next Steps in Your Profile
            </h3>
            <p className="text-xs text-[#627086] leading-relaxed">
              Once you finish your Common Profile, complete your pathway preferences to unlock automated matching and personalized readiness actions.
            </p>
            <div className="pt-2 space-y-2">
              <Link
                to="/profile/career"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#102641] transition-all flex items-center justify-between text-xs font-bold text-[#102641]"
              >
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={15} className="text-[#087b63]" />
                  <span>Career profile</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/profile/scholarships"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#102641] transition-all flex items-center justify-between text-xs font-bold text-[#102641]"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap size={15} className="text-[#087b63]" />
                  <span>Scholarship profile</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
