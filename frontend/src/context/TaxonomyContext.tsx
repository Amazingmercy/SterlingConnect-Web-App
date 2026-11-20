import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import {
  SECTORS as FALLBACK_SECTORS,
  JOB_FUNCTIONS as FALLBACK_FUNCTIONS,
  CONTROLLED_SKILLS as FALLBACK_SKILLS,
  CONTROLLED_STUDY_FIELDS as FALLBACK_STUDY_FIELDS,
  QUALIFICATIONS as FALLBACK_QUALIFICATIONS,
  SectorItem,
  JobFunctionItem,
  QualificationItem,
  TaxonomyItemWithAliases,
} from '../features/profile/data/careerTaxonomy';

interface TaxonomyContextType {
  sectors: SectorItem[];
  jobFunctions: JobFunctionItem[];
  skills: string[];
  skillsWithAliases: TaxonomyItemWithAliases[];
  studyFields: string[];
  studyFieldsWithAliases: TaxonomyItemWithAliases[];
  qualifications: QualificationItem[];
  isLoading: boolean;
  refreshTaxonomies: () => Promise<void>;
  filterByQuery: (
    items: Array<{ label?: string; name?: string; aliases?: string[] }>,
    query: string
  ) => any[];
}

const TaxonomyContext = createContext<TaxonomyContextType | undefined>(undefined);

export const TaxonomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sectors, setSectors] = useState<SectorItem[]>(FALLBACK_SECTORS);
  const [jobFunctions, setJobFunctions] = useState<JobFunctionItem[]>(FALLBACK_FUNCTIONS);
  const [skills, setSkills] = useState<string[]>(FALLBACK_SKILLS);
  const [skillsWithAliases, setSkillsWithAliases] = useState<TaxonomyItemWithAliases[]>([]);
  const [studyFields, setStudyFields] = useState<string[]>(FALLBACK_STUDY_FIELDS);
  const [studyFieldsWithAliases, setStudyFieldsWithAliases] = useState<TaxonomyItemWithAliases[]>([]);
  const [qualifications, setQualifications] = useState<QualificationItem[]>(FALLBACK_QUALIFICATIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTaxonomies = useCallback(async () => {
    try {
      const res = await api.get('/taxonomies');
      const grouped = res.data?.grouped;

      if (grouped) {
        if (Array.isArray(grouped.SECTOR) && grouped.SECTOR.length > 0) {
          setSectors(
            grouped.SECTOR.map((s: any) => ({
              id: s.code || s.id,
              label: s.name,
              aliases: s.aliases?.map((a: any) => a.alias) || [],
            }))
          );
        }
        if (Array.isArray(grouped.FUNCTION) && grouped.FUNCTION.length > 0) {
          setJobFunctions(
            grouped.FUNCTION.map((f: any) => ({
              id: f.code || f.id,
              label: f.name,
              aliases: f.aliases?.map((a: any) => a.alias) || [],
            }))
          );
        }
        if (Array.isArray(grouped.SKILL) && grouped.SKILL.length > 0) {
          setSkills(grouped.SKILL.map((sk: any) => sk.name));
          setSkillsWithAliases(
            grouped.SKILL.map((sk: any) => ({
              id: sk.id,
              code: sk.code,
              name: sk.name,
              aliases: sk.aliases?.map((a: any) => a.alias) || [],
            }))
          );
        }
        if (Array.isArray(grouped.STUDY_FIELD) && grouped.STUDY_FIELD.length > 0) {
          setStudyFields(grouped.STUDY_FIELD.map((sf: any) => sf.name));
          setStudyFieldsWithAliases(
            grouped.STUDY_FIELD.map((sf: any) => ({
              id: sf.id,
              code: sf.code,
              name: sf.name,
              aliases: sf.aliases?.map((a: any) => a.alias) || [],
            }))
          );
        }
        if (Array.isArray(grouped.DEGREE_LEVEL) && grouped.DEGREE_LEVEL.length > 0) {
          setQualifications(
            grouped.DEGREE_LEVEL.map((q: any) => ({
              key: q.code || q.id,
              label: q.name,
            }))
          );
        }
      }
    } catch {
      // Keep fallbacks on network or offline error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByQuery = useCallback(
    (items: Array<{ label?: string; name?: string; aliases?: string[] }>, query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return items;
      return items.filter((item) => {
        const primary = (item.label || item.name || '').toLowerCase();
        if (primary.includes(q)) return true;
        if (Array.isArray(item.aliases)) {
          return item.aliases.some((al) => al.toLowerCase().includes(q));
        }
        return false;
      });
    },
    []
  );

  useEffect(() => {
    fetchTaxonomies();
  }, [fetchTaxonomies]);

  return (
    <TaxonomyContext.Provider
      value={{
        sectors,
        jobFunctions,
        skills,
        skillsWithAliases,
        studyFields,
        studyFieldsWithAliases,
        qualifications,
        isLoading,
        refreshTaxonomies: fetchTaxonomies,
        filterByQuery,
      }}
    >
      {children}
    </TaxonomyContext.Provider>
  );
};

export const useTaxonomies = (): TaxonomyContextType => {
  const context = useContext(TaxonomyContext);
  if (!context) {
    throw new Error('useTaxonomies must be used within a TaxonomyProvider');
  }
  return context;
};
