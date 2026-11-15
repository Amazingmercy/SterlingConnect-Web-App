import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useTaxonomies } from '../../context/TaxonomyContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  STUDY_LEVELS,
  CONTROLLED_STUDY_FIELDS,
  FUNDING_PREFERENCES,
  START_YEARS,
  ACADEMIC_RESULTS,
  LANGUAGE_TEST_STATUSES,
  RESEARCH_INTERESTS_TOPICS,
} from './data/careerTaxonomy';
import { ALL_COUNTRY_NAMES } from './data/isoCountries';
import {
  GraduationCap,
  Globe2,
  Calendar,
  Award,
  Check,
  Plus,
  X,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';

interface ScholarshipPreferencesSectionProps {
  standalone?: boolean;
  onSaved?: () => void;
}

export const ScholarshipPreferencesSection: React.FC<ScholarshipPreferencesSectionProps> = ({
  standalone = false,
  onSaved,
}) => {
  const { profile, updateScholarship, saveProfile, isSaving } = useProfile();
  const { studyFields: dynamicStudyFields, studyFieldsWithAliases } = useTaxonomies();
  const { scholarship, common } = profile;
  const { toast } = useToast();

  const [selectedCountryToAdd, setSelectedCountryToAdd] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');

  const studyLevels = scholarship.desiredStudyLevels || [];
  const studyFields = scholarship.desiredFields || [];
  const countries = scholarship.preferredStudyCountries || [];
  const fundingPref = scholarship.fundingRequirement || 'Full funding';
  const startYear = scholarship.intendedStartYear || '2026';
  const academicResult = scholarship.academicClassification || common.academicClassification || 'First Class Honours (or GPA 3.8 - 4.0 / 4.0)';
  const langStatus = scholarship.languageTestStatus || 'Exempt (Graduated from English-medium university)';
  const dob = scholarship.dateOfBirth || '';

  const researchTopics: string[] = React.useMemo(() => {
    let raw: string[] = [];
    if (Array.isArray(scholarship.researchInterests)) {
      raw = scholarship.researchInterests;
    } else if (typeof scholarship.researchInterests === 'string' && scholarship.researchInterests.trim()) {
      try {
        const parsed = JSON.parse(scholarship.researchInterests);
        if (Array.isArray(parsed)) {
          raw = parsed;
        } else {
          raw = scholarship.researchInterests.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        raw = scholarship.researchInterests.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    // Only count topics that are valid options in RESEARCH_INTERESTS_TOPICS
    return raw.filter((topic) => RESEARCH_INTERESTS_TOPICS.includes(topic));
  }, [scholarship.researchInterests]);

  const toggleLevel = (level: string) => {
    let next: string[];
    if (studyLevels.includes(level)) {
      next = studyLevels.filter((l) => l !== level);
    } else {
      next = [...studyLevels, level];
    }
    updateScholarship({ desiredStudyLevels: next });
  };

  const toggleField = (field: string) => {
    let next: string[];
    if (studyFields.includes(field)) {
      next = studyFields.filter((f) => f !== field);
    } else {
      if (studyFields.length >= 6) return;
      next = [...studyFields, field];
    }
    updateScholarship({ desiredFields: next });
  };

  const addCountry = (country: string) => {
    if (!country) return;
    if (!countries.includes(country)) {
      updateScholarship({
        preferredStudyCountries: [...countries, country],
        noPreferredCountry: false,
      });
    }
    setSelectedCountryToAdd('');
  };

  const removeCountry = (country: string) => {
    updateScholarship({
      preferredStudyCountries: countries.filter((c) => c !== country),
    });
  };

  const setNoStatedDestination = () => {
    updateScholarship({
      preferredStudyCountries: [],
      noPreferredCountry: true,
    });
  };

  const toggleResearchTopic = (topic: string) => {
    let next: string[];
    if (researchTopics.includes(topic)) {
      next = researchTopics.filter((t) => t !== topic);
    } else {
      if (researchTopics.length >= 5) return;
      next = [...researchTopics, topic];
    }
    updateScholarship({ researchInterests: next });
  };

  const allStudyFields = Array.from(
    new Set([...studyFields, ...(dynamicStudyFields.length > 0 ? dynamicStudyFields : CONTROLLED_STUDY_FIELDS)])
  );

  const filteredStudyFields = allStudyFields.filter((field) => {
    if (!fieldFilter.trim()) return true;
    const q = fieldFilter.trim().toLowerCase();
    if (field.toLowerCase().includes(q)) return true;
    const matched = studyFieldsWithAliases.find((sf) => sf.name.toLowerCase() === field.toLowerCase());
    return matched?.aliases.some((al) => al.toLowerCase().includes(q));
  });

  const filteredResearchTopics = (
    RESEARCH_INTERESTS_TOPICS.length > 0 ? RESEARCH_INTERESTS_TOPICS : researchTopics
  ).filter((topic) => {
    if (!interestFilter.trim()) return true;
    return topic.toLowerCase().includes(interestFilter.trim().toLowerCase());
  });

  const handleSave = async () => {
    await saveProfile();
    toast('Your scholarship profile has been updated.', 'success');
    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Title & Introduction - Exact Display Copy */}
      <div className="space-y-1">
        <h3 className="font-brand font-extrabold text-xl text-[#102641]">
          Tell us about your study plans
        </h3>
        <p className="text-xs sm:text-sm text-[#627086]">
          A clearer study profile helps you explore scholarships that may fit your goals and qualifications.
        </p>
      </div>

      {/* Level of Study (U10) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
        <label className="text-xs font-bold text-[#102641] block">
          What level of study are you considering?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STUDY_LEVELS.map((lvl) => {
            const isSelected = studyLevels.includes(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => toggleLevel(lvl)}
                className={`p-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#102641] text-white border-[#102641] shadow-2xs'
                    : 'bg-white text-[#42516a] border-[#e4eaf0] hover:bg-slate-50'
                }`}
              >
                <span>{lvl}</span>
                {isSelected && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields of Study (U10) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#102641]">
            Which fields would you like to study?
          </label>
          <span className="text-[11px] text-[#627086]">
            {studyFields.length} of 6 selected
          </span>
        </div>
        <p className="text-[11px] text-[#627086]">
          Select controlled academic study disciplines to match eligibility criteria.
        </p>

        <div className="pt-1">
          <Input
            placeholder="Filter study fields or aliases (e.g. Economics, Computing, Biotech)..."
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto p-1.5 bg-[#f8fafb] rounded-xl border border-slate-100">
          {filteredStudyFields.length === 0 ? (
            <span className="text-[11px] text-slate-400 p-2">No approved study fields match &quot;{fieldFilter}&quot;.</span>
          ) : (
            filteredStudyFields.map((field) => {
              const isSelected = studyFields.includes(field);
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => toggleField(field)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#087b63] text-white border-[#087b63] shadow-xs'
                      : 'bg-white text-[#42516a] border-[#e4eaf0] hover:border-[#b8dcd0]'
                  }`}
                >
                  <span>{field}</span>
                  {isSelected && <Check size={12} strokeWidth={2.5} />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Destination Countries & Funding Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Where would you like to study? (U10) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
          <label className="text-xs font-bold text-[#102641] block">
            Where would you like to study?
          </label>
          <p className="text-[11px] text-[#627086]">
            Optional country multi-select. No preferred study country means no stated destination preference.
          </p>

          <div className="flex flex-wrap gap-1.5 min-h-[42px]">
            {countries.length > 0 ? (
              countries.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f2f4f9] text-[#102641] border border-[#e4eaf0]"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCountry(c)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-[#627086] italic self-center">
                No stated destination preference (open to opportunities globally)
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <select
              value={selectedCountryToAdd}
              onChange={(e) => addCountry(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-medium text-[#102641] focus:outline-none"
            >
              <option value="">+ Add target country</option>
              {ALL_COUNTRY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {countries.length > 0 && (
              <button
                type="button"
                onClick={setNoStatedDestination}
                className="px-2.5 py-1 text-[11px] font-bold text-[#627086] hover:text-[#102641] border border-[#e4eaf0] rounded-lg"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Funding Preference & Intended Start Year (U10) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102641] block">
              What funding would you prefer?
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {FUNDING_PREFERENCES.map((fp) => {
                const isSelected = fundingPref === fp;
                return (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => updateScholarship({ fundingRequirement: fp })}
                    className={`p-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#087b63] text-white border-[#087b63]'
                        : 'bg-white text-[#42516a] border-[#e4eaf0] hover:bg-slate-50'
                    }`}
                  >
                    {fp}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102641] block">
              When would you like to start?
            </label>
            <div className="flex gap-2">
              {START_YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => updateScholarship({ intendedStartYear: yr })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    startYear === yr
                      ? 'bg-[#102641] text-white border-[#102641]'
                      : 'bg-white text-[#42516a] border-[#e4eaf0] hover:bg-slate-50'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Result & Language Status Grid (U10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Results (U10) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-2">
          <label className="text-xs font-bold text-[#102641] block">
            Your academic result or classification
          </label>
          <p className="text-[11px] text-[#627086]">
            Use the result shown on your official record. Different grading systems are not automatically treated as equivalent.
          </p>
          <select
            value={academicResult}
            onChange={(e) => updateScholarship({ academicClassification: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
          >
            {ACADEMIC_RESULTS.map((res) => (
              <option key={res} value={res}>
                {res}
              </option>
            ))}
          </select>
        </div>

        {/* Language Test (U10) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-2">
          <label className="text-xs font-bold text-[#102641] block">
            Language test or exemption status
          </label>
          <p className="text-[11px] text-[#627086]">
            If a scholarship requires a test, record your current status. Check whether the provider accepts an exemption.
          </p>
          <select
            value={langStatus}
            onChange={(e) => updateScholarship({ languageTestStatus: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
          >
            {LANGUAGE_TEST_STATUSES.map((ls) => (
              <option key={ls} value={ls}>
                {ls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Research or Career Interests & Date of Birth (U10) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Interests (8 cols) */}
        <div className="sm:col-span-8 p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#102641]">
                Research or career interests
              </label>
              <span className="text-[11px] text-[#627086]">
                {researchTopics.length} of 5 selected
              </span>
            </div>
            <p className="text-[11px] text-[#627086]">
              Controlled topic multi-select to pair with research grants and fellowship priorities.
            </p>
          </div>

          <div className="pt-1">
            <Input
              placeholder="Filter research topics..."
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {filteredResearchTopics.length === 0 ? (
              <span className="text-[11px] text-slate-400 p-1">No research topics match &quot;{interestFilter}&quot;.</span>
            ) : (
              filteredResearchTopics.map((topic) => {
                const isSelected = researchTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleResearchTopic(topic)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]'
                        : 'bg-[#f8fafb] text-[#526078] border-[#e4eaf0] hover:bg-white'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Date of Birth (4 cols) (U10) */}
        <div className="sm:col-span-4 p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-2">
          <label className="text-xs font-bold text-[#102641] block">
            Date of birth
          </label>
          <p className="text-[11px] text-[#627086]">
            Only where explicit age criterion needs it.
          </p>
          <div className="pt-2">
            <input
              type="date"
              value={dob}
              onChange={(e) => updateScholarship({ dateOfBirth: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
            />
          </div>
          <small className="block text-[10px] text-[#627086] pt-1">
            Certain age-restricted youth fellowships (e.g. Under 30) rely on verified birth dates.
          </small>
        </div>
      </div>

      {/* Standalone Save Button (U10) */}
      {standalone && (
        <div className="pt-4 border-t border-[#edf0f3] flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
            rightIcon={<Check size={14} />}
          >
            Save scholarship profile
          </Button>
        </div>
      )}
    </div>
  );
};
