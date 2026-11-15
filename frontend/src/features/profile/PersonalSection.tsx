import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ALL_COUNTRY_NAMES } from './data/isoCountries';

const STATUS_OPTIONS = [
  'Recent Graduate',
  'Final Year Student',
  'Undergraduate Student',
  'Employed full-time',
  'Employed part-time',
  'Self-employed / Freelance',
  'Seeking opportunity',
  'Other',
];

export const PersonalSection: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateCommon } = useProfile();
  const { common } = profile;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h3 className="text-[15px] font-bold text-[#102641]">Personal &amp; Background Information</h3>
        <p className="text-[12px] text-[#627086] mt-0.5">
          These details ensure we accurately verify your regional eligibility for funding and career programmes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={user?.firstName || ''}
          disabled
          helperText="Synced from account"
          className="bg-slate-50 cursor-not-allowed text-[#627086]"
        />
        <Input
          label="Last name"
          value={user?.lastName || ''}
          disabled
          helperText="Synced from account"
          className="bg-slate-50 cursor-not-allowed text-[#627086]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Country of residence"
          required
          value={common.countryOfResidence}
          onChange={(e) => updateCommon({ countryOfResidence: e.target.value })}
        >
          {ALL_COUNTRY_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Input
          label="Nationality or nationalities"
          required
          value={common.nationalities?.join(', ') || user?.nationality || 'Nigerian'}
          onChange={(e) => updateCommon({ nationalities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="e.g. Nigerian, Ghanaian"
        />
      </div>

      <div>
        <Input
          label="Email address"
          value={user?.email || ''}
          disabled
          helperText="Verified account email; change requires re-verification"
          className="bg-slate-50 cursor-not-allowed text-[#627086]"
        />
      </div>

      <div>
        <Select
          label="Current professional / academic status"
          required
          value={common.currentStatus}
          onChange={(e) => updateCommon({ currentStatus: e.target.value })}
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};
