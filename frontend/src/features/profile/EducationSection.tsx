import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useTaxonomies } from '../../context/TaxonomyContext';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const FIELDS_OF_STUDY = [
  'Economics & Development Studies',
  'Computer Science & Software Engineering',
  'Data Science & Artificial Intelligence',
  'Business Administration & Finance',
  'Public Policy & International Relations',
  'Law & Human Rights',
  'Mechanical & Civil Engineering',
  'Public Health & Medicine',
  'Biological & Chemical Sciences',
  'Education & Pedagogy',
  'Media, Arts & Communications',
  'Other',
];

const ACADEMIC_CLASSIFICATIONS = [
  'First Class Honours (or GPA 3.8 - 4.0 / 4.0)',
  'Second Class Upper (2:1 / GPA 3.0 - 3.79 / 4.0)',
  'Second Class Lower (2:2 / GPA 2.5 - 2.99 / 4.0)',
  'Distinction (Postgraduate)',
  'Merit (Postgraduate)',
  'Pass / Third Class',
  'Other / Local Grading Scale',
];

export const EducationSection: React.FC = () => {
  const { profile, updateCommon } = useProfile();
  const { qualifications, studyFields } = useTaxonomies();
  const { common } = profile;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h3 className="text-[15px] font-bold text-[#102641]">Educational Background</h3>
        <p className="text-[12px] text-[#627086] mt-0.5">
          Your educational history helps match you against admission cut-offs and academic scholarship requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Highest completed qualification"
          required
          value={common.highestQualification}
          onChange={(e) => updateCommon({ highestQualification: e.target.value })}
          helperText="Choose a qualification you have already completed."
        >
          {qualifications.map((q) => (
            <option key={q.key} value={q.label}>
              {q.label}
            </option>
          ))}
        </Select>

        <Select
          label="Field / Discipline of study"
          required
          value={common.fieldOfStudy}
          onChange={(e) => updateCommon({ fieldOfStudy: e.target.value })}
        >
          {(studyFields.length > 0 ? studyFields : FIELDS_OF_STUDY).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="University / Institution name"
          placeholder="e.g. University of Lagos, Makerere University"
          value={common.institution}
          onChange={(e) => updateCommon({ institution: e.target.value })}
        />

        <Input
          label="Graduation year (or expected)"
          placeholder="e.g. 2025"
          value={common.graduationYear}
          onChange={(e) => updateCommon({ graduationYear: e.target.value })}
        />
      </div>

      <div>
        <Select
          label="Academic result / classification"
          required
          value={common.academicClassification}
          onChange={(e) => updateCommon({ academicClassification: e.target.value })}
          helperText="Select the closest equivalent to your transcript or graduating classification."
        >
          {ACADEMIC_CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};
