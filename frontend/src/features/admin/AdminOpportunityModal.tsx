import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X,
  Check,
  AlertCircle,
  Eye,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Calendar,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  opportunityToEdit?: any | null;
  initialType?: 'EMPLOYMENT' | 'SCHOLARSHIP';
}

export const AdminOpportunityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
  opportunityToEdit,
  initialType = 'EMPLOYMENT',
}) => {
  const isEditing = Boolean(opportunityToEdit);

  const [oppType, setOppType] = useState<'EMPLOYMENT' | 'SCHOLARSHIP'>(
    opportunityToEdit?.opportunityType || initialType
  );

  // Common core fields
  const [title, setTitle] = useState(opportunityToEdit?.title || '');
  const [organization, setOrganization] = useState(opportunityToEdit?.organization || '');
  const [country, setCountry] = useState(opportunityToEdit?.country || 'United Kingdom');
  const [location, setLocation] = useState(opportunityToEdit?.location || 'London');
  const [deadline, setDeadline] = useState(
    opportunityToEdit?.deadline ? new Date(opportunityToEdit.deadline).toISOString().split('T')[0] : ''
  );
  const [applicationUrl, setApplicationUrl] = useState(opportunityToEdit?.applicationUrl || '');
  const [sourceUrl, setSourceUrl] = useState(opportunityToEdit?.sourceUrl || '');
  const [overview, setOverview] = useState(opportunityToEdit?.overview || '');
  const [requirements, setRequirements] = useState(opportunityToEdit?.requirements || '');
  const [status, setStatus] = useState(opportunityToEdit?.status || 'PUBLISHED');

  // Employment fields (A05)
  const [subType, setSubType] = useState(opportunityToEdit?.employmentDetail?.subType || 'Full-time');
  const [sector, setSector] = useState(opportunityToEdit?.employmentDetail?.sector || 'Technology & Software');
  const [jobFunction, setJobFunction] = useState(
    opportunityToEdit?.employmentDetail?.function || 'Software Engineering'
  );
  const [workArrangement, setWorkArrangement] = useState(
    opportunityToEdit?.employmentDetail?.workArrangement || 'HYBRID'
  );
  const [experienceLevel, setExperienceLevel] = useState(
    opportunityToEdit?.employmentDetail?.experienceLevel || 'Entry'
  );
  const [minimumEducation, setMinimumEducation] = useState(
    opportunityToEdit?.employmentDetail?.minimumEducation || 'Bachelor'
  );
  const [requiredSkills, setRequiredSkills] = useState(
    Array.isArray(opportunityToEdit?.employmentDetail?.requiredSkills)
      ? opportunityToEdit.employmentDetail.requiredSkills.join(', ')
      : 'Communication, Teamwork'
  );
  const [compensationRange, setCompensationRange] = useState(
    opportunityToEdit?.employmentDetail?.compensationRange || ''
  );

  // Comprehensive Scholarship fields (A06)
  const [fundingLevel, setFundingLevel] = useState(
    opportunityToEdit?.scholarshipDetail?.fundingLevel || 'FULLY_FUNDED'
  );
  const [studyLevels, setStudyLevels] = useState(
    Array.isArray(opportunityToEdit?.scholarshipDetail?.studyLevels)
      ? opportunityToEdit.scholarshipDetail.studyLevels.join(', ')
      : "Master's, PhD"
  );
  const [eligibleFields, setEligibleFields] = useState(
    Array.isArray(opportunityToEdit?.scholarshipDetail?.eligibleFields)
      ? opportunityToEdit.scholarshipDetail.eligibleFields.join(', ')
      : 'All Fields'
  );
  const [eligibleNationalities, setEligibleNationalities] = useState(
    Array.isArray(opportunityToEdit?.scholarshipDetail?.eligibleNationalities)
      ? opportunityToEdit.scholarshipDetail.eligibleNationalities.join(', ')
      : 'All Nationalities'
  );
  const [academicRequirement, setAcademicRequirement] = useState(
    opportunityToEdit?.scholarshipDetail?.academicRequirement || 'First Class or 2:1 equivalent'
  );
  const [experienceRequirement, setExperienceRequirement] = useState(
    opportunityToEdit?.scholarshipDetail?.experienceRequirement || 'No professional experience required'
  );
  const [languageRequirement, setLanguageRequirement] = useState(
    opportunityToEdit?.scholarshipDetail?.languageRequirement || 'IELTS 6.5 or equivalent'
  );
  const [programStartYear, setProgramStartYear] = useState<number>(
    opportunityToEdit?.scholarshipDetail?.programStartYear || new Date().getFullYear() + 1
  );

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever opportunityToEdit, isOpen or initialType changes
  useEffect(() => {
    if (opportunityToEdit) {
      setOppType(opportunityToEdit.opportunityType || initialType);
      setTitle(opportunityToEdit.title || '');
      setOrganization(opportunityToEdit.organization || '');
      setCountry(opportunityToEdit.country || 'United Kingdom');
      setLocation(opportunityToEdit.location || 'London');
      setDeadline(
        opportunityToEdit.deadline
          ? new Date(opportunityToEdit.deadline).toISOString().split('T')[0]
          : ''
      );
      setApplicationUrl(opportunityToEdit.applicationUrl || '');
      setSourceUrl(opportunityToEdit.sourceUrl || '');
      setOverview(opportunityToEdit.overview || '');
      setRequirements(opportunityToEdit.requirements || '');
      setStatus(opportunityToEdit.status || 'PUBLISHED');

      // Employment Detail
      const emp = opportunityToEdit.employmentDetail;
      if (emp) {
        setSubType(emp.subType || 'Full-time');
        setSector(emp.sector || 'Technology & Software');
        setJobFunction(emp.function || 'Software Engineering');
        setWorkArrangement(emp.workArrangement || 'HYBRID');
        setExperienceLevel(emp.experienceLevel || 'Entry');
        setMinimumEducation(emp.minimumEducation || 'Bachelor');
        setRequiredSkills(
          Array.isArray(emp.requiredSkills)
            ? emp.requiredSkills.join(', ')
            : emp.requiredSkills || ''
        );
        setCompensationRange(emp.compensationRange || '');
      }

      // Scholarship Detail
      const sch = opportunityToEdit.scholarshipDetail;
      if (sch) {
        setFundingLevel(sch.fundingLevel || 'FULLY_FUNDED');
        setStudyLevels(
          Array.isArray(sch.studyLevels)
            ? sch.studyLevels.join(', ')
            : sch.studyLevels || ''
        );
        setEligibleFields(
          Array.isArray(sch.eligibleFields)
            ? sch.eligibleFields.join(', ')
            : sch.eligibleFields || ''
        );
        setEligibleNationalities(
          Array.isArray(sch.eligibleNationalities)
            ? sch.eligibleNationalities.join(', ')
            : sch.eligibleNationalities || ''
        );
        setAcademicRequirement(sch.academicRequirement || '');
        setExperienceRequirement(sch.experienceRequirement || '');
        setLanguageRequirement(sch.languageRequirement || '');
        setProgramStartYear(sch.programStartYear || new Date().getFullYear() + 1);
      }
      setError(null);
      setIsPreviewMode(false);
    } else if (isOpen) {
      // Defaults for creating new opportunity
      setOppType(initialType);
      setTitle('');
      setOrganization('');
      setCountry('United Kingdom');
      setLocation('London');
      setDeadline('');
      setApplicationUrl('');
      setSourceUrl('');
      setOverview('');
      setRequirements('');
      setStatus('PUBLISHED');
      setSubType('Full-time');
      setSector('Technology & Software');
      setJobFunction('Software Engineering');
      setWorkArrangement('HYBRID');
      setExperienceLevel('Entry');
      setMinimumEducation('Bachelor');
      setRequiredSkills('Communication, Teamwork');
      setCompensationRange('');
      setFundingLevel('FULLY_FUNDED');
      setStudyLevels("Master's, PhD");
      setEligibleFields('All Fields');
      setEligibleNationalities('All Nationalities');
      setAcademicRequirement('First Class or 2:1 equivalent');
      setExperienceRequirement('No professional experience required');
      setLanguageRequirement('IELTS 6.5 or equivalent');
      setProgramStartYear(new Date().getFullYear() + 1);
      setError(null);
      setIsPreviewMode(false);
    }
  }, [opportunityToEdit, isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (submitStatus = status) => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim() || !organization.trim() || !deadline || !applicationUrl.trim()) {
        throw new Error('Please fill all required fields: Title, Organization, Deadline, Application URL.');
      }

      const payload: any = {
        opportunityType: oppType,
        title: title.trim(),
        organization: organization.trim(),
        country: country.trim(),
        location: location.trim(),
        deadline: new Date(deadline).toISOString(),
        applicationUrl: applicationUrl.trim(),
        sourceUrl: sourceUrl.trim() || applicationUrl.trim(),
        overview: overview.trim(),
        requirements: requirements.trim(),
        status: submitStatus,
      };

      if (oppType === 'EMPLOYMENT') {
        payload.employmentDetail = {
          subType,
          sector,
          function: jobFunction,
          workArrangement,
          experienceLevel,
          minimumEducation,
          requiredSkills: requiredSkills
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
          compensationRange: compensationRange ? compensationRange.trim() : undefined,
        };
      } else {
        payload.scholarshipDetail = {
          fundingLevel,
          studyLevels: studyLevels
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
          eligibleFields: eligibleFields
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
          eligibleNationalities: eligibleNationalities
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
          academicRequirement: academicRequirement.trim(),
          experienceRequirement: experienceRequirement.trim() || undefined,
          languageRequirement: languageRequirement.trim() || undefined,
          programStartYear: Number(programStartYear) || new Date().getFullYear() + 1,
        };
      }

      if (isEditing) {
        await api.put(`/admin/opportunities/${opportunityToEdit.id}`, payload);
      } else {
        await api.post('/admin/opportunities', payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-serif font-bold text-gray-900">
              {oppType === 'EMPLOYMENT' ? 'Employment opportunity' : 'Scholarship opportunity'}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {oppType === 'EMPLOYMENT'
                ? 'Record the employer’s stated requirements and official application details.'
                : 'Record funding, study options and eligibility from the official provider.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                isPreviewMode
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {isPreviewMode ? 'Back to Editor' : 'Preview'}
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* State Notice Banner */}
        <div className="px-6 pt-4">
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
              oppType === 'EMPLOYMENT'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-blue-700" />
            <span>
              {oppType === 'EMPLOYMENT'
                ? 'Complete the required fields and verify the official source before publishing.'
                : 'Mark unclear criteria as unknown. Do not assume unrestricted eligibility.'}
            </span>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Modal Content: Preview or Form */}
        {isPreviewMode ? (
          <div className="p-6 space-y-6">
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    oppType === 'EMPLOYMENT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {oppType}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Closes: {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline specified'}
                </span>
              </div>

              <div>
                <h4 className="text-xl font-serif font-bold text-slate-900">{title || 'Untitled Opportunity'}</h4>
                <p className="text-sm font-semibold text-slate-700 mt-1">{organization || 'Organization'}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {location}, {country}
                  </span>
                  {oppType === 'SCHOLARSHIP' && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <GraduationCap className="w-3.5 h-3.5" /> {fundingLevel.replace(/_/g, ' ')}
                    </span>
                  )}
                  {oppType === 'EMPLOYMENT' && (
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      <Briefcase className="w-3.5 h-3.5" /> {workArrangement} • {experienceLevel}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
                <p>
                  <strong>Overview:</strong> {overview || 'No overview provided.'}
                </p>
                <p>
                  <strong>Requirements:</strong> {requirements || 'No specific requirements listed.'}
                </p>
              </div>

              {oppType === 'SCHOLARSHIP' && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <p>
                    <strong>Funding Level:</strong> {fundingLevel.replace(/_/g, ' ')}
                  </p>
                  <p>
                    <strong>Study Levels:</strong> {studyLevels}
                  </p>
                  <p>
                    <strong>Eligible Fields:</strong> {eligibleFields}
                  </p>
                  <p>
                    <strong>Academic Requirement:</strong> {academicRequirement}
                  </p>
                  <p>
                    <strong>Experience Requirement:</strong> {experienceRequirement}
                  </p>
                  <p>
                    <strong>Language Requirement:</strong> {languageRequirement}
                  </p>
                  <p>
                    <strong>Intake Year:</strong> {programStartYear}
                  </p>
                </div>
              )}

              {applicationUrl && (
                <div className="pt-2">
                  <a
                    href={applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline gap-1"
                  >
                    Official Application Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-6 space-y-6"
          >
            {/* Type Switcher */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOppType('EMPLOYMENT')}
                  className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                    oppType === 'EMPLOYMENT'
                      ? 'border-[#102641] bg-[#102641] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <Briefcase className="w-4 h-4" /> Employment
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">Corporate jobs, internships & fellowships</div>
                </button>
                <button
                  type="button"
                  onClick={() => setOppType('SCHOLARSHIP')}
                  className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                    oppType === 'SCHOLARSHIP'
                      ? 'border-[#102641] bg-[#102641] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                    <GraduationCap className="w-4 h-4" /> Scholarship
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">Academic funding, study options & awards</div>
                </button>
              </div>
            )}

            {/* Core Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opportunity Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    oppType === 'EMPLOYMENT'
                      ? 'e.g. Senior Software Engineer - Cloud Systems'
                      : 'e.g. Rhodes Scholarship for Global Leadership'
                  }
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {oppType === 'EMPLOYMENT' ? 'Employer / Company' : 'Scholarship Provider / Trust'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Google, Oxford University, Chevening Trust"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Application Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Application URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verified Official Source URL (Verification Link)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://provider.org/official-announcement"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Overview & Objectives</label>
                <textarea
                  rows={3}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="Summarize the core opportunity scope and purpose..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Requirements & Selection Criteria
                </label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Essential criteria, eligibility, and profile expectations..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Type-Specific Details */}
            {oppType === 'EMPLOYMENT' ? (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Employment Specific Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Work Arrangement</label>
                    <select
                      value={workArrangement}
                      onChange={(e) => setWorkArrangement(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    >
                      <option value="ONSITE">Onsite</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="REMOTE">Remote</option>
                      <option value="ANY">Any Arrangement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Graduate Program">Graduate Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
                    <input
                      type="text"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Function / Family</label>
                    <input
                      type="text"
                      value={jobFunction}
                      onChange={(e) => setJobFunction(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    >
                      <option value="Entry">Entry-level (0-2 years)</option>
                      <option value="Mid">Mid-level (3-5 years)</option>
                      <option value="Senior">Senior (5+ years)</option>
                      <option value="Lead/Executive">Lead / Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Compensation Range</label>
                    <input
                      type="text"
                      value={compensationRange}
                      onChange={(e) => setCompensationRange(e.target.value)}
                      placeholder="e.g. £45,000 - £55,000"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Required Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={requiredSkills}
                      onChange={(e) => setRequiredSkills(e.target.value)}
                      placeholder="React, TypeScript, SQL, Commercial Awareness"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Comprehensive Scholarship Opportunity Details (A06) */
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Scholarship Opportunity Details
                  </h4>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Mark unclear criteria as unknown
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Funding Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fundingLevel}
                      onChange={(e) => setFundingLevel(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="FULLY_FUNDED">Fully Funded (Tuition + Living Stipend + Travel)</option>
                      <option value="PARTIAL_TUITION">Partial Tuition Coverage</option>
                      <option value="STIPEND_ONLY">Stipend / Living Allowance Only</option>
                      <option value="VARIABLE">Variable / Merit-based Award</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Intake / Start Year
                    </label>
                    <input
                      type="number"
                      value={programStartYear}
                      onChange={(e) => setProgramStartYear(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Eligible Study Levels (comma separated)
                    </label>
                    <input
                      type="text"
                      value={studyLevels}
                      onChange={(e) => setStudyLevels(e.target.value)}
                      placeholder="Master's, PhD, Undergraduate, Postdoctoral"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Eligible Fields of Study
                    </label>
                    <input
                      type="text"
                      value={eligibleFields}
                      onChange={(e) => setEligibleFields(e.target.value)}
                      placeholder="All Fields, STEM, Health Sciences, Economics"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Requirement / GPA
                    </label>
                    <input
                      type="text"
                      value={academicRequirement}
                      onChange={(e) => setAcademicRequirement(e.target.value)}
                      placeholder="First Class Honours, 3.5+ GPA, or unknown"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Eligible Nationalities
                    </label>
                    <input
                      type="text"
                      value={eligibleNationalities}
                      onChange={(e) => setEligibleNationalities(e.target.value)}
                      placeholder="All Nationalities, Commonwealth, Africa, or unknown"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Language Requirement
                    </label>
                    <input
                      type="text"
                      value={languageRequirement}
                      onChange={(e) => setLanguageRequirement(e.target.value)}
                      placeholder="IELTS 6.5, TOEFL 90, or unknown"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Experience Requirement
                    </label>
                    <input
                      type="text"
                      value={experienceRequirement}
                      onChange={(e) => setExperienceRequirement(e.target.value)}
                      placeholder="e.g. 2 years professional experience, or none"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Publishing Controls & Actions (A05 / A06: Save draft | Preview | Publish) */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Target State:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="PUBLISHED">Published (Available in Discovery)</option>
                  <option value="DRAFT">Draft (Internal Only)</option>
                  <option value="ARCHIVED">Archived (Unpublished)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('PUBLISHED')}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-[#102641] rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  {isSubmitting ? 'Saving...' : 'Publish'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
