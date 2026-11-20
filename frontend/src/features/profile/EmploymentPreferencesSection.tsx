import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useTaxonomies } from '../../context/TaxonomyContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  SECTORS,
  JOB_FUNCTIONS,
  OPPORTUNITY_TYPES,
  WORK_ARRANGEMENTS,
  CONTROLLED_SKILLS,
} from './data/careerTaxonomy';
import { ALL_COUNTRY_NAMES } from './data/isoCountries';
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Plus,
  X,
  AlertCircle,
  Globe2,
  ShieldCheck,
} from 'lucide-react';
import type { SectorPreferenceMode, FunctionPreferenceMode } from '../../types/profile';

interface EmploymentPreferencesSectionProps {
  standalone?: boolean;
  onSaved?: () => void;
}

export const EmploymentPreferencesSection: React.FC<EmploymentPreferencesSectionProps> = ({
  standalone = false,
  onSaved,
}) => {
  const { profile, updateEmployment, saveProfile, isSaving } = useProfile();
  const {
    sectors: dynamicSectors,
    jobFunctions: dynamicFunctions,
    skills: dynamicSkills,
    skillsWithAliases,
  } = useTaxonomies();
  const sectorsList = dynamicSectors.length > 0 ? dynamicSectors : SECTORS;
  const functionsList = dynamicFunctions.length > 0 ? dynamicFunctions : JOB_FUNCTIONS;
  const skillsList = dynamicSkills.length > 0 ? dynamicSkills : CONTROLLED_SKILLS;
  const { employment, common } = profile;
  const { toast } = useToast();

  const [skillFilter, setSkillFilter] = useState('');
  const [selectedSectorToAdd, setSelectedSectorToAdd] = useState('');
  const [selectedFunctionToAdd, setSelectedFunctionToAdd] = useState('');
  const [selectedCountryToAdd, setSelectedCountryToAdd] = useState('');

  // Filter skills by canonical label or alias
  const filteredSkills = skillsList.filter((skillName) => {
    if (!skillFilter.trim()) return true;
    const q = skillFilter.trim().toLowerCase();
    if (skillName.toLowerCase().includes(q)) return true;
    const matched = skillsWithAliases.find((sk) => sk.name.toLowerCase() === skillName.toLowerCase());
    return matched?.aliases.some((al) => al.toLowerCase().includes(q));
  });

  const currentMode: SectorPreferenceMode = employment.sector_preference_mode || 'selected';
  const currentFunctionMode: FunctionPreferenceMode = employment.function_preference_mode || 'selected';
  const sectorIds = employment.sector_ids || [];
  const functionIds = employment.function_ids || [];
  const locations = employment.preferredLocations?.length
    ? employment.preferredLocations
    : [common.countryOfResidence || 'Nigeria'];
  const workAuth = (typeof employment.workAuthorisation === 'object' && !Array.isArray(employment.workAuthorisation))
    ? employment.workAuthorisation
    : {};

  // Sector Mode Switcher (mutually exclusive)
  const setSectorMode = (mode: SectorPreferenceMode) => {
    if (mode === 'any') {
      updateEmployment({
        sector_preference_mode: 'any',
        sector_ids: [],
        sectorsOfInterest: ['Open to any sector'],
      });
    } else if (mode === 'undecided') {
      updateEmployment({
        sector_preference_mode: 'undecided',
        sector_ids: [],
        sectorsOfInterest: ['Not sure yet'],
      });
    } else {
      updateEmployment({
        sector_preference_mode: 'selected',
        sector_ids: sectorIds,
        sectorsOfInterest: sectorsList.filter((s) => sectorIds.includes(s.id)).map((s) => s.label),
      });
    }
  };

  // Function Mode Switcher (mutually exclusive)
  const setFunctionMode = (mode: FunctionPreferenceMode) => {
    if (mode === 'any') {
      updateEmployment({
        function_preference_mode: 'any',
        function_ids: [],
        functionsOfInterest: ['Open to different functions'],
      });
    } else if (mode === 'undecided') {
      updateEmployment({
        function_preference_mode: 'undecided',
        function_ids: [],
        functionsOfInterest: ['Not sure yet'],
      });
    } else {
      updateEmployment({
        function_preference_mode: 'selected',
        function_ids: functionIds,
        functionsOfInterest: functionsList.filter((f) => functionIds.includes(f.id)).map((f) => f.label),
      });
    }
  };

  // Toggle Sector
  const toggleSector = (sectorId: string) => {
    let nextIds: string[];
    if (sectorIds.includes(sectorId)) {
      nextIds = sectorIds.filter((id) => id !== sectorId);
    } else {
      nextIds = [...sectorIds, sectorId];
    }
    const nextLabels = sectorsList.filter((s) => nextIds.includes(s.id)).map((s) => s.label);
    updateEmployment({
      sector_preference_mode: 'selected',
      sector_ids: nextIds,
      sectorsOfInterest: nextLabels,
    });
  };

  // Toggle Function
  const toggleFunction = (funcId: string) => {
    let nextIds: string[];
    if (functionIds.includes(funcId)) {
      nextIds = functionIds.filter((id) => id !== funcId);
    } else {
      nextIds = [...functionIds, funcId];
    }
    const nextLabels = functionsList.filter((f) => nextIds.includes(f.id)).map((f) => f.label);
    updateEmployment({
      function_preference_mode: 'selected',
      function_ids: nextIds,
      functionsOfInterest: nextLabels,
    });
  };

  const removeSector = (label: string) => {
    const nextLabels = (employment.sectorsOfInterest || []).filter((l) => l !== label);
    const matchedSector = sectorsList.find((s) => s.label === label);
    const nextIds = matchedSector ? sectorIds.filter((id) => id !== matchedSector.id) : sectorIds;
    updateEmployment({
      sector_ids: nextIds,
      sectorsOfInterest: nextLabels,
    });
  };

  const handleSelectSectorFromDropdown = (sectorId: string) => {
    if (!sectorId) return;
    const sector = sectorsList.find((s) => s.id === sectorId);
    if (!sector) return;
    const currentLabels = employment.sectorsOfInterest || [];
    const nextIds = sectorIds.includes(sectorId) ? sectorIds : [...sectorIds, sectorId];
    const nextLabels = currentLabels.includes(sector.label) ? currentLabels : [...currentLabels, sector.label];
    updateEmployment({
      sector_preference_mode: 'selected',
      sector_ids: nextIds,
      sectorsOfInterest: nextLabels,
    });
    setSelectedSectorToAdd('');
  };

  const removeFunction = (label: string) => {
    const nextLabels = (employment.functionsOfInterest || []).filter((l) => l !== label);
    const matched = functionsList.find((f) => f.label === label);
    const nextIds = matched ? functionIds.filter((id) => id !== matched.id) : functionIds;
    updateEmployment({
      function_ids: nextIds,
      functionsOfInterest: nextLabels,
    });
  };

  const handleSelectFunctionFromDropdown = (funcId: string) => {
    if (!funcId) return;
    const func = functionsList.find((f) => f.id === funcId);
    if (!func) return;
    const currentLabels = employment.functionsOfInterest || [];
    const nextIds = functionIds.includes(funcId) ? functionIds : [...functionIds, funcId];
    const nextLabels = currentLabels.includes(func.label) ? currentLabels : [...currentLabels, func.label];
    updateEmployment({
      function_preference_mode: 'selected',
      function_ids: nextIds,
      functionsOfInterest: nextLabels,
    });
    setSelectedFunctionToAdd('');
  };

  // Toggle Opportunity Type
  const toggleOppType = (type: string) => {
    const current = employment.opportunityTypes || [];
    let next: string[];
    if (current.includes(type)) {
      next = current.filter((t) => t !== type);
    } else {
      next = [...current, type];
    }
    updateEmployment({ opportunityTypes: next });
  };

  // Toggle Controlled Skill
  const toggleSkill = (skill: string) => {
    const current = employment.skills || [];
    if (current.includes(skill)) {
      updateEmployment({ skills: current.filter((s) => s !== skill) });
    } else {
      if (current.length >= 10) return;
      updateEmployment({ skills: [...current, skill] });
    }
  };

  // Location management
  const addLocation = (country: string) => {
    if (!country) return;
    if (!locations.includes(country)) {
      updateEmployment({ preferredLocations: [...locations, country] });
    }
    setSelectedCountryToAdd('');
  };

  const removeLocation = (country: string) => {
    updateEmployment({ preferredLocations: locations.filter((c) => c !== country) });
  };

  // Work Authorisation per country
  const setCountryAuth = (country: string, auth: 'Yes' | 'No' | 'Not sure') => {
    updateEmployment({
      workAuthorisation: {
        ...workAuth,
        [country]: auth,
      },
    });
  };

  const handleSave = async () => {
    await saveProfile();
    toast('Your career profile has been updated.', 'success');
    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Title & Introduction - Exact Display Copy */}
      <div className="space-y-1">
        <h3 className="font-brand font-extrabold text-xl text-[#102641]">
          Shape your career preferences
        </h3>
        <p className="text-xs sm:text-sm text-[#627086]">
          Tell us what kind of work interests you and where you would like to do it.
        </p>
      </div>

      {/* Sectors Section (U09) */}
      <div className="space-y-3 p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#102641] block">
            Which sectors interest you?
          </label>
          <p className="text-[11px] text-[#627086]">
            Choose the industries you would like to work in. You can select more than one.
          </p>
        </div>

        {/* Preference Mode Selector (Mutually Exclusive) */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSectorMode('selected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentMode === 'selected'
                ? 'bg-[#102641] text-white border-[#102641]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Select specific industries ({sectorIds.length})
          </button>

          <button
            type="button"
            onClick={() => setSectorMode('any')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentMode === 'any'
                ? 'bg-[#087b63] text-white border-[#087b63]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Open to any sector
          </button>

          <button
            type="button"
            onClick={() => setSectorMode('undecided')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentMode === 'undecided'
                ? 'bg-[#087b63] text-white border-[#087b63]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Not sure yet
          </button>
        </div>

        {/* Sectors Selection (Shown when selected mode is active) */}
        {currentMode === 'selected' && (
          <div className="pt-2 space-y-3">
            {/* Selected Sector Badges */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Selected sectors ({(employment.sectorsOfInterest || []).length}):
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-white rounded-xl border border-slate-200">
                {(employment.sectorsOfInterest || []).length > 0 ? (
                  (employment.sectorsOfInterest || []).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => removeSector(label)}
                        className="hover:text-red-600 transition cursor-pointer"
                        title="Remove sector"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 self-center italic">
                    No sectors selected yet. Choose from the list or add a sector below.
                  </span>
                )}
              </div>
            </div>

            {/* Dropdown Selector */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Choose from approved sectors:
              </label>
              <select
                value={selectedSectorToAdd}
                onChange={(e) => handleSelectSectorFromDropdown(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
              >
                <option value="">+ Select a sector to add...</option>
                {sectorsList.map((s) => {
                  const isAlreadySelected = sectorIds.includes(s.id) || (employment.sectorsOfInterest || []).includes(s.label);
                  const aliasHint = s.aliases && s.aliases.length > 0 ? ` (e.g. ${s.aliases.slice(0, 3).join(', ')})` : '';
                  return (
                    <option key={s.id} value={s.id} disabled={isAlreadySelected}>
                      {s.label}{aliasHint} {isAlreadySelected ? '✓' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-[#627086] italic mt-1.5">
                Note: Other Services is a genuine industry category, not a free-text catch-all.
              </p>
            </div>
          </div>
        )}

        {currentMode === 'any' && (
          <div className="p-3 rounded-xl bg-[#e3f4ed]/40 border border-[#bddbd1] text-[11px] text-[#05644f]">
            You are open to opportunities in any industry. No sector filter will restrict your matching.
          </div>
        )}

        {currentMode === 'undecided' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            Sector preference is marked as undecided. You can explore broadly and refine your preferences anytime.
          </div>
        )}
      </div>

      {/* Job Functions Section (U09) */}
      <div className="space-y-3 p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#102641] block">
            Which types of work interest you?
          </label>
          <p className="text-[11px] text-[#627086]">
            Choose the work you want to do, such as finance, communications or project management. This can apply across different sectors.
          </p>
        </div>

        {/* Preference Mode Selector (Mutually Exclusive) */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFunctionMode('selected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentFunctionMode === 'selected'
                ? 'bg-[#102641] text-white border-[#102641]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Select specific functions ({functionIds.length})
          </button>

          <button
            type="button"
            onClick={() => setFunctionMode('any')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentFunctionMode === 'any'
                ? 'bg-[#087b63] text-white border-[#087b63]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Open to different functions
          </button>

          <button
            type="button"
            onClick={() => setFunctionMode('undecided')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currentFunctionMode === 'undecided'
                ? 'bg-[#087b63] text-white border-[#087b63]'
                : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
            }`}
          >
            Not sure yet
          </button>
        </div>

        {currentFunctionMode === 'selected' && (
          <div className="pt-2 space-y-3">
            {/* Selected Job Function Badges */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Selected functions ({(employment.functionsOfInterest || []).length}):
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-white rounded-xl border border-slate-200">
                {(employment.functionsOfInterest || []).length > 0 ? (
                  (employment.functionsOfInterest || []).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f2f4f9] text-[#102641] border border-[#e4eaf0]"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => removeFunction(label)}
                        className="hover:text-red-600 transition cursor-pointer"
                        title="Remove function"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 self-center italic">
                    No functions selected yet. Choose from the list or add a job function below.
                  </span>
                )}
              </div>
            </div>

            {/* Dropdown Selector */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Choose from approved job functions:
              </label>
              <select
                value={selectedFunctionToAdd}
                onChange={(e) => handleSelectFunctionFromDropdown(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#e4eaf0] bg-white text-xs font-semibold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
              >
                <option value="">+ Select a job function to add...</option>
                {functionsList.map((f) => {
                  const isAlreadySelected = functionIds.includes(f.id) || (employment.functionsOfInterest || []).includes(f.label);
                  const aliasHint = f.aliases && f.aliases.length > 0 ? ` (e.g. ${f.aliases.slice(0, 2).join(', ')})` : '';
                  return (
                    <option key={f.id} value={f.id} disabled={isAlreadySelected}>
                      {f.label}{aliasHint} {isAlreadySelected ? '✓' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        {currentFunctionMode === 'any' && (
          <div className="p-3 rounded-xl bg-[#e3f4ed]/40 border border-[#bddbd1] text-[11px] text-[#05644f]">
            You are open to different job functions across sectors. No function filter will restrict your matching.
          </div>
        )}

        {currentFunctionMode === 'undecided' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            Job function preference is marked as undecided. You can explore opportunities broadly and refine your preferences later.
          </div>
        )}
      </div>

      {/* Experience & Opportunity Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Experience (U09) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-2">
          <label className="text-xs font-bold text-[#102641] block">
            How many years of work experience do you have?
          </label>
          <p className="text-[11px] text-[#627086]">
            Include relevant paid work, internships and substantial volunteer work.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="50"
              value={employment.yearsOfExperience || '0'}
              onChange={(e) => updateEmployment({ yearsOfExperience: e.target.value })}
              className="w-24 h-10 px-3 rounded-lg border border-[#e4eaf0] text-sm font-bold text-[#102641] focus:ring-2 focus:ring-[#90cfc0] focus:outline-none"
            />
            <span className="text-xs text-[#627086]">years (enter 0 if recent graduate)</span>
          </div>
        </div>

        {/* Opportunity Types (U09) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-2">
          <label className="text-xs font-bold text-[#102641] block">
            Which opportunities would you like to explore?
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            {OPPORTUNITY_TYPES.map((t) => {
              const isSelected = (employment.opportunityTypes || []).includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleOppType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#087b63] text-white border-[#087b63]'
                      : 'bg-white text-[#42516a] border-[#e4eaf0] hover:border-[#b8dcd0]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skills Section (U09) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#102641]">
              Which skills would you like to highlight?
            </label>
            <span className="text-[11px] text-[#627086]">
              {(employment.skills || []).length} of 10 highlighted
            </span>
          </div>
          <p className="text-[11px] text-[#627086]">
            Select skills you can currently use. Courses you buy do not automatically add skills to your profile.
          </p>
        </div>

        {/* Filter Skills or Aliases */}
        <div className="pt-1">
          <Input
            placeholder="Filter skills or aliases (e.g. Scrum, Python, Agile, BI)..."
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Controlled Skill Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {filteredSkills.length === 0 ? (
            <span className="text-[11px] text-slate-400 p-1">No approved skills match &quot;{skillFilter}&quot;.</span>
          ) : (
            filteredSkills.map((skill) => {
              const isSelected = (employment.skills || []).includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1]'
                      : 'bg-[#f8fafb] text-[#526078] border-[#e4eaf0] hover:bg-white'
                  }`}
                >
                  {skill}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Locations & Preferred Work Arrangement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Preferred Work Arrangement (U09) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
          <label className="text-xs font-bold text-[#102641] block">
            Preferred work arrangement
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WORK_ARRANGEMENTS.map((arr) => {
              const isSelected = employment.workArrangement === arr;
              return (
                <button
                  key={arr}
                  type="button"
                  onClick={() => updateEmployment({ workArrangement: arr })}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#102641] text-white border-[#102641] shadow-2xs'
                      : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
                  }`}
                >
                  {arr}
                </button>
              );
            })}
          </div>

          {/* Conditional Remote Helper (U09) */}
          {employment.workArrangement === 'Remote' && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
              <AlertCircle size={15} className="flex-shrink-0 text-blue-600 mt-0.5" />
              <span>
                Some remote roles are limited to particular countries. Check each employer’s requirements.
              </span>
            </div>
          )}
        </div>

        {/* Where would you like to work? (U09) */}
        <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
          <label className="text-xs font-bold text-[#102641] block">
            Where would you like to work?
          </label>

          <div className="flex flex-wrap gap-1.5 min-h-[42px]">
            {locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f2f4f9] text-[#102641] border border-[#e4eaf0]"
              >
                <span>{loc}</span>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <select
              value={selectedCountryToAdd}
              onChange={(e) => addLocation(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border border-[#e4eaf0] bg-white text-xs font-medium text-[#102641] focus:outline-none"
            >
              <option value="">+ Add target location</option>
              <option value="Remote (Global)">Remote (Global)</option>
              {ALL_COUNTRY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Authorisation Checklist (U09) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e4eaf0] shadow-2xs space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#102641] block">
            Work Authorisation Status
          </label>
          <p className="text-[11px] text-[#627086]">
            Confirm your current legal right to work in your target locations.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {locations.map((countryName) => {
            const currentAuth =
              (workAuth as any)[countryName] ||
              (countryName === common.countryOfResidence || countryName === 'Remote (Global)'
                ? 'Yes'
                : 'Not sure');
            return (
              <div
                key={countryName}
                className="p-3 rounded-xl border border-slate-100 bg-[#f8fafb] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="font-bold text-[#102641]">
                  {countryName === 'Remote (Global)'
                    ? 'Are you authorised to work for Remote (Global) roles?'
                    : `Are you authorised to work in ${countryName}?`}
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Yes', 'No', 'Not sure'] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setCountryAuth(countryName, choice)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        currentAuth === choice
                          ? 'bg-[#087b63] text-white border-[#087b63]'
                          : 'bg-white text-[#526078] border-[#e4eaf0] hover:bg-slate-50'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standalone Save Button (U09) */}
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
            Save career profile
          </Button>
        </div>
      )}
    </div>
  );
};
