export interface SectorItem {
  id: string;
  label: string;
  aliases?: string[];
}

export interface JobFunctionItem {
  id: string;
  label: string;
  aliases?: string[];
}

export interface TaxonomyItemWithAliases {
  id: string;
  code: string;
  name: string;
  aliases: string[];
}

export interface QualificationItem {
  key: string;
  label: string;
}

// U08 Exact Qualification Enum & Display Labels
export const QUALIFICATIONS: QualificationItem[] = [
  { key: 'secondary', label: 'Secondary school' },
  { key: 'bachelor', label: 'Bachelor’s degree' },
  { key: 'master', label: 'Master’s degree' },
  { key: 'phd', label: 'Doctorate or PhD' },
  { key: 'other', label: 'Other qualification' },
];

// Exact 22 Sectors from Launch Proposal
export const SECTORS: SectorItem[] = [
  { id: 'agriculture_agribusiness', label: 'Agriculture & Agribusiness' },
  { id: 'finance_insurance', label: 'Banking, Finance & Insurance' },
  { id: 'construction_infrastructure', label: 'Construction & Infrastructure' },
  { id: 'education_training', label: 'Education & Training' },
  { id: 'energy_utilities', label: 'Energy & Utilities' },
  { id: 'environment_water_waste', label: 'Environment, Water & Waste Management' },
  { id: 'government_public_admin', label: 'Government & Public Administration' },
  { id: 'health_social_care', label: 'Health & Social Care' },
  { id: 'hospitality_tourism', label: 'Hospitality & Tourism' },
  { id: 'it_digital', label: 'Information Technology & Digital Services' },
  { id: 'manufacturing', label: 'Manufacturing & Industrial Production' },
  { id: 'media_publishing', label: 'Media, Publishing & Communications' },
  { id: 'mining_oil_gas', label: 'Mining, Oil & Gas' },
  { id: 'nonprofit_development', label: 'Nonprofit, Humanitarian & International Development' },
  { id: 'professional_scientific', label: 'Professional, Scientific & Technical Services' },
  { id: 'real_estate', label: 'Real Estate & Property Services' },
  { id: 'retail_wholesale', label: 'Retail, Wholesale & E-commerce' },
  { id: 'telecommunications', label: 'Telecommunications' },
  { id: 'transport_logistics', label: 'Transport & Logistics' },
  { id: 'arts_sports', label: 'Arts, Culture, Sports & Entertainment' },
  { id: 'business_support', label: 'Administrative & Business Support Services' },
  { id: 'other_services', label: 'Other Services' },
];

// Exact 22 Job Functions from Launch Proposal
export const JOB_FUNCTIONS: JobFunctionItem[] = [
  { id: 'administration', label: 'Administration & Office Support' },
  { id: 'finance_accounting', label: 'Finance & Accounting' },
  { id: 'hr_people', label: 'Human Resources & People Operations' },
  { id: 'communications', label: 'Communications & Public Relations' },
  { id: 'marketing', label: 'Marketing & Digital Marketing' },
  { id: 'sales', label: 'Sales & Business Development' },
  { id: 'customer_support', label: 'Customer Service & Support' },
  { id: 'programme_project', label: 'Programme & Project Management' },
  { id: 'operations', label: 'Operations & Service Delivery' },
  { id: 'procurement_supply', label: 'Procurement & Supply Chain' },
  { id: 'merl', label: 'Monitoring, Evaluation, Research & Learning' },
  { id: 'policy_advocacy', label: 'Policy, Advocacy & Government Relations' },
  { id: 'partnerships', label: 'Partnerships & Fundraising' },
  { id: 'teaching', label: 'Teaching, Training & Learning Design' },
  { id: 'health_practice', label: 'Clinical Practice & Public Health' },
  { id: 'software_it', label: 'Software Development & IT Support' },
  { id: 'data_analytics', label: 'Data & Analytics' },
  { id: 'engineering', label: 'Engineering & Technical Services' },
  { id: 'creative_design', label: 'Creative Design & Content Production' },
  { id: 'legal_compliance', label: 'Legal, Compliance & Risk' },
  { id: 'community', label: 'Community Engagement & Social Services' },
  { id: 'strategy_management', label: 'Strategy & General Management' },
];

export const OPPORTUNITY_TYPES = [
  'Job',
  'Internship',
  'Graduate programme',
  'Fellowship',
];

export const WORK_ARRANGEMENTS = [
  'Remote',
  'Hybrid',
  'On-site',
  'Any arrangement',
];

export const POPULAR_COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Rwanda',
  'Egypt',
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'Australia',
  'Netherlands',
];

export const CONTROLLED_SKILLS = [
  'Data Analysis & Visualization',
  'Project Management & PMO',
  'Financial Modeling & Forecasting',
  'Strategic Communications & PR',
  'Monitoring, Evaluation & Learning (MEL)',
  'Python & SQL Programming',
  'Stakeholder Management',
  'Policy Analysis & Briefing',
  'Public Speaking & Presentation',
  'Grant Writing & Fundraising',
  'Digital Marketing & SEO',
  'Agile & Scrum Methodologies',
  'Product Design (UI/UX)',
  'Risk Assessment & Compliance',
  'Operations Management',
];

// U10 Scholarship Taxonomy
export const STUDY_LEVELS = [
  'Undergraduate',
  "Master’s",
  'PhD',
  'Professional study',
];

export const CONTROLLED_STUDY_FIELDS = [
  'Economics & Development Studies',
  'Computer Science, Artificial Intelligence & Software',
  'Public Health, Epidemiology & Global Medicine',
  'Public Policy, Governance & International Relations',
  'Business Administration, Finance & Accounting',
  'Civil, Mechanical & Renewable Energy Engineering',
  'Law, Human Rights & International Justice',
  'Environmental Science, Climate & Sustainability',
  'Data Science, Statistics & Analytics',
  'Education, Pedagogy & Learning Design',
  'Media, Journalism & Strategic Communications',
  'Biological, Biomedical & Chemical Sciences',
];

export const FUNDING_PREFERENCES = [
  'Full funding',
  'Partial funding',
  'Any funding level',
];

export const START_YEARS = ['2026', '2027', '2028', '2029', '2030'];

export const ACADEMIC_RESULTS = [
  'First Class Honours (or GPA 3.8 - 4.0 / 4.0)',
  'Second Class Upper (2:1 / GPA 3.0 - 3.79 / 4.0)',
  'Second Class Lower (2:2 / GPA 2.5 - 2.99 / 4.0)',
  'Distinction (Postgraduate degree)',
  'Merit (Postgraduate degree)',
  'Pass / Third Class',
  'Local Grading Scale (Other)',
];

export const LANGUAGE_TEST_STATUSES = [
  'Exempt (Graduated from English-medium university)',
  'IELTS Completed (Overall Band 7.5+)',
  'IELTS Completed (Overall Band 6.5 - 7.0)',
  'TOEFL iBT Completed (100+)',
  'Planning to take (IELTS / TOEFL)',
  'Not yet decided / Need guidance',
  'Provider exemption accepted',
];

export const RESEARCH_INTERESTS_TOPICS = [
  'Sustainable Economic Development in Africa',
  'Artificial Intelligence Ethics & Applied Machine Learning',
  'Global Health Governance & Infectious Disease Control',
  'Renewable Energy Transitions & Climate Resilience',
  'Public Sector Innovation & Fiscal Policy',
  'Financial Inclusion, Fintech & Digital Banking',
  'Human Rights, Transitional Justice & Rule of Law',
  'Agricultural Value Chains & Food Security',
  'Higher Education Access & EdTech Innovation',
  'Urban Planning, Infrastructure & Smart Cities',
];
