import { PrismaClient, TaxonomyType } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

interface TaxonomySeedItem {
  type: TaxonomyType;
  code: string;
  name: string;
  aliases?: string[];
}

const TAXONOMY_SEEDS: TaxonomySeedItem[] = [
  // ==========================================
  // 1. SECTOR (22 exact sectors from U09 spec)
  // ==========================================
  {
    type: TaxonomyType.SECTOR,
    code: 'agriculture_agribusiness',
    name: 'Agriculture & Agribusiness',
    aliases: ['Agriculture', 'Agribusiness', 'Farming', 'Agronomy'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'finance_insurance',
    name: 'Banking, Finance & Insurance',
    aliases: ['Finance', 'Banking', 'Insurance', 'Fintech', 'Financial Services'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'construction_infrastructure',
    name: 'Construction & Infrastructure',
    aliases: ['Construction', 'Infrastructure', 'Civil Works', 'Building'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'education_training',
    name: 'Education & Training',
    aliases: ['Education', 'Training', 'EdTech', 'Academia', 'Higher Education'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'energy_utilities',
    name: 'Energy & Utilities',
    aliases: ['Energy', 'Utilities', 'Power', 'Renewables', 'Solar', 'Clean Energy'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'environment_water_waste',
    name: 'Environment, Water & Waste Management',
    aliases: ['Environment', 'Water', 'Waste Management', 'Sustainability', 'Ecology'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'government_public_admin',
    name: 'Government & Public Administration',
    aliases: ['Government', 'Public Administration', 'Civil Service', 'Public Sector'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'health_social_care',
    name: 'Health & Social Care',
    aliases: ['Healthcare', 'Health', 'Social Care', 'Medicine', 'Public Health Care'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'hospitality_tourism',
    name: 'Hospitality & Tourism',
    aliases: ['Hospitality', 'Tourism', 'Travel', 'Hotels', 'Leisure'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'it_digital',
    name: 'Information Technology & Digital Services',
    aliases: ['IT', 'Software', 'Technology', 'Digital Services', 'Computer Systems'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'manufacturing',
    name: 'Manufacturing & Industrial Production',
    aliases: ['Manufacturing', 'Industrial Production', 'Assembly', 'Heavy Industry'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'media_publishing',
    name: 'Media, Publishing & Communications',
    aliases: ['Media', 'Publishing', 'Journalism', 'Broadcasting', 'Press'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'mining_oil_gas',
    name: 'Mining, Oil & Gas',
    aliases: ['Mining', 'Oil & Gas', 'Petroleum', 'Extractives', 'Geology'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'nonprofit_development',
    name: 'Nonprofit, Humanitarian & International Development',
    aliases: ['NGO', 'Nonprofit', 'Humanitarian', 'International Development', 'Civil Society'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'professional_scientific',
    name: 'Professional, Scientific & Technical Services',
    aliases: ['Consulting', 'Professional Services', 'Scientific Research', 'Advisory'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'real_estate',
    name: 'Real Estate & Property Services',
    aliases: ['Real Estate', 'Property', 'Commercial Real Estate', 'Housing'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'retail_wholesale',
    name: 'Retail, Wholesale & E-commerce',
    aliases: ['Retail', 'Wholesale', 'E-commerce', 'Consumer Goods', 'FMCG'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'telecommunications',
    name: 'Telecommunications',
    aliases: ['Telecoms', 'Telecom', 'Wireless', 'Networks', 'Connectivity'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'transport_logistics',
    name: 'Transport & Logistics',
    aliases: ['Transport', 'Logistics', 'Freight', 'Supply Chain Transport', 'Aviation'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'arts_sports',
    name: 'Arts, Culture, Sports & Entertainment',
    aliases: ['Arts', 'Culture', 'Sports', 'Entertainment', 'Creative Industries'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'business_support',
    name: 'Administrative & Business Support Services',
    aliases: ['Business Support', 'Administrative Services', 'Back Office', 'Facilities'],
  },
  {
    type: TaxonomyType.SECTOR,
    code: 'other_services',
    name: 'Other Services',
    aliases: ['Other', 'General Services'],
  },

  // ==========================================
  // 2. FUNCTION (22 exact functions from U09 spec)
  // ==========================================
  {
    type: TaxonomyType.FUNCTION,
    code: 'administration',
    name: 'Administration & Office Support',
    aliases: ['Administration', 'Office Management', 'Executive Assistant', 'Secretarial'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'finance_accounting',
    name: 'Finance & Accounting',
    aliases: ['Finance', 'Accounting', 'Audit', 'Bookkeeping', 'Financial Control'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'hr_people',
    name: 'Human Resources & People Operations',
    aliases: ['HR', 'Human Resources', 'People Operations', 'Recruitment', 'Talent'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'communications',
    name: 'Communications & Public Relations',
    aliases: ['Communications', 'PR', 'Public Relations', 'Internal Communications'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'marketing',
    name: 'Marketing & Digital Marketing',
    aliases: ['Marketing', 'Digital Marketing', 'Growth Marketing', 'Brand Management'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'sales',
    name: 'Sales & Business Development',
    aliases: ['Sales', 'Business Development', 'Account Management', 'Client Acquisition'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'customer_support',
    name: 'Customer Service & Support',
    aliases: ['Customer Service', 'Customer Support', 'Client Success', 'Helpdesk'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'programme_project',
    name: 'Programme & Project Management',
    aliases: ['Project Management', 'Programme Management', 'PMO', 'Scrum Master'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'operations',
    name: 'Operations & Service Delivery',
    aliases: ['Operations', 'Service Delivery', 'Business Operations', 'COO'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'procurement_supply',
    name: 'Procurement & Supply Chain',
    aliases: ['Procurement', 'Supply Chain', 'Purchasing', 'Sourcing', 'Inventory'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'merl',
    name: 'Monitoring, Evaluation, Research & Learning',
    aliases: ['MEL', 'M&E', 'Monitoring & Evaluation', 'Impact Assessment', 'MERL'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'policy_advocacy',
    name: 'Policy, Advocacy & Government Relations',
    aliases: ['Policy', 'Advocacy', 'Government Relations', 'Public Affairs'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'partnerships',
    name: 'Partnerships & Fundraising',
    aliases: ['Partnerships', 'Fundraising', 'Donor Relations', 'Resource Mobilization'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'teaching',
    name: 'Teaching, Training & Learning Design',
    aliases: ['Teaching', 'Training', 'Instructional Design', 'Lecturing', 'Facilitation'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'health_practice',
    name: 'Clinical Practice & Public Health',
    aliases: ['Clinical Practice', 'Public Health', 'Nursing', 'Medicine', 'Healthcare Practice'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'software_it',
    name: 'Software Development & IT Support',
    aliases: ['Software Engineering', 'IT Support', 'Web Development', 'DevOps', 'Cloud Engineering'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'data_analytics',
    name: 'Data & Analytics',
    aliases: ['Data Analytics', 'Data Science', 'Business Intelligence', 'Analytics', 'BI'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'engineering',
    name: 'Engineering & Technical Services',
    aliases: ['Engineering', 'Technical Services', 'Civil Engineering', 'Mechanical Engineering'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'creative_design',
    name: 'Creative Design & Content Production',
    aliases: ['Graphic Design', 'UI/UX Design', 'Content Creation', 'Art Direction'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'legal_compliance',
    name: 'Legal, Compliance & Risk',
    aliases: ['Legal', 'Compliance', 'Risk Management', 'Regulatory Affairs', 'Corporate Law'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'community',
    name: 'Community Engagement & Social Services',
    aliases: ['Community Engagement', 'Social Work', 'Outreach', 'Community Mobilization'],
  },
  {
    type: TaxonomyType.FUNCTION,
    code: 'strategy_management',
    name: 'Strategy & General Management',
    aliases: ['Strategy', 'General Management', 'Executive Leadership', 'Corporate Strategy'],
  },

  // ==========================================
  // 3. SKILL (15 controlled skills from spec)
  // ==========================================
  {
    type: TaxonomyType.SKILL,
    code: 'skill_data_analysis',
    name: 'Data Analysis & Visualization',
    aliases: ['Data Analysis', 'Data Visualization', 'PowerBI', 'Tableau', 'Excel Analytics'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_project_management',
    name: 'Project Management & PMO',
    aliases: ['Project Management', 'PMO', 'PMP', 'Prince2', 'Project Delivery'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_financial_modeling',
    name: 'Financial Modeling & Forecasting',
    aliases: ['Financial Modeling', 'Financial Analysis', 'Forecasting', 'Valuation'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_strategic_comms',
    name: 'Strategic Communications & PR',
    aliases: ['Strategic Communications', 'Public Relations', 'Press Releases', 'Crisis Comms'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_merl',
    name: 'Monitoring, Evaluation & Learning (MEL)',
    aliases: ['MEL', 'M&E', 'Impact Evaluation', 'Logframes', 'Indicator Tracking'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_python_sql',
    name: 'Python & SQL Programming',
    aliases: ['Python', 'SQL', 'Coding', 'Database Querying', 'Backend Scripting'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_stakeholder_mgmt',
    name: 'Stakeholder Management',
    aliases: ['Stakeholder Engagement', 'Client Relationship', 'Executive Communication'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_policy_analysis',
    name: 'Policy Analysis & Briefing',
    aliases: ['Policy Briefs', 'Policy Research', 'Legislative Analysis'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_public_speaking',
    name: 'Public Speaking & Presentation',
    aliases: ['Public Speaking', 'Presentations', 'Pitching', 'Keynote Delivery'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_grant_writing',
    name: 'Grant Writing & Fundraising',
    aliases: ['Grant Writing', 'Proposal Writing', 'Fundraising Proposals', 'Bid Writing'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_digital_marketing',
    name: 'Digital Marketing & SEO',
    aliases: ['Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Google Ads'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_agile_scrum',
    name: 'Agile & Scrum Methodologies',
    aliases: ['Agile', 'Scrum', 'Kanban', 'Sprint Planning', 'Jira'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_product_design',
    name: 'Product Design (UI/UX)',
    aliases: ['UI/UX', 'Figma', 'User Research', 'Product Design', 'Wireframing'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_risk_compliance',
    name: 'Risk Assessment & Compliance',
    aliases: ['Risk Assessment', 'Regulatory Compliance', 'Internal Audit', 'Due Diligence'],
  },
  {
    type: TaxonomyType.SKILL,
    code: 'skill_operations_mgmt',
    name: 'Operations Management',
    aliases: ['Operations Management', 'Process Optimization', 'Lean', 'Standard Operating Procedures'],
  },

  // ==========================================
  // 4. STUDY_FIELD (12 controlled study fields from U10 spec)
  // ==========================================
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_economics_dev',
    name: 'Economics & Development Studies',
    aliases: ['Economics', 'Development Studies', 'International Development', 'Political Economy'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_computer_science',
    name: 'Computer Science, Artificial Intelligence & Software',
    aliases: ['Computer Science', 'AI', 'Software Engineering', 'Informatics', 'Cybersecurity'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_public_health',
    name: 'Public Health, Epidemiology & Global Medicine',
    aliases: ['Public Health', 'Epidemiology', 'Global Health', 'Health Policy'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_public_policy',
    name: 'Public Policy, Governance & International Relations',
    aliases: ['Public Policy', 'Governance', 'International Relations', 'Diplomacy'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_business_admin',
    name: 'Business Administration, Finance & Accounting',
    aliases: ['Business Administration', 'MBA', 'Finance', 'Accounting', 'Management'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_engineering',
    name: 'Civil, Mechanical & Renewable Energy Engineering',
    aliases: ['Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Renewable Energy'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_law_human_rights',
    name: 'Law, Human Rights & International Justice',
    aliases: ['Law', 'LLM', 'Human Rights', 'International Justice', 'Jurisprudence'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_environmental_sci',
    name: 'Environmental Science, Climate & Sustainability',
    aliases: ['Environmental Science', 'Climate Change', 'Sustainability', 'Conservation'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_data_science',
    name: 'Data Science, Statistics & Analytics',
    aliases: ['Data Science', 'Statistics', 'Applied Statistics', 'Machine Learning'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_education',
    name: 'Education, Pedagogy & Learning Design',
    aliases: ['Education', 'Pedagogy', 'Instructional Design', 'Educational Leadership'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_media_journalism',
    name: 'Media, Journalism & Strategic Communications',
    aliases: ['Media', 'Journalism', 'Mass Communication', 'Strategic Communications'],
  },
  {
    type: TaxonomyType.STUDY_FIELD,
    code: 'field_biological_sciences',
    name: 'Biological, Biomedical & Chemical Sciences',
    aliases: ['Biological Sciences', 'Biomedical Science', 'Biochemistry', 'Chemistry'],
  },

  // ==========================================
  // 5. DEGREE_LEVEL (5 qualifications from U08 spec)
  // ==========================================
  {
    type: TaxonomyType.DEGREE_LEVEL,
    code: 'secondary',
    name: 'Secondary school',
    aliases: ['High School', 'O-Levels', 'A-Levels', 'Secondary Education'],
  },
  {
    type: TaxonomyType.DEGREE_LEVEL,
    code: 'bachelor',
    name: "Bachelor's degree",
    aliases: ['Undergraduate', 'BSc', 'BA', 'BEng', 'BEd', 'BTech'],
  },
  {
    type: TaxonomyType.DEGREE_LEVEL,
    code: 'master',
    name: "Master's degree",
    aliases: ['Postgraduate', 'MSc', 'MA', 'MBA', 'MEng', 'MPhil'],
  },
  {
    type: TaxonomyType.DEGREE_LEVEL,
    code: 'phd',
    name: 'Doctorate or PhD',
    aliases: ['Doctorate', 'PhD', 'DPhil', 'Doctoral'],
  },
  {
    type: TaxonomyType.DEGREE_LEVEL,
    code: 'other',
    name: 'Other qualification',
    aliases: ['Diploma', 'Certificate', 'Professional Certification', 'Other'],
  },
];

async function main() {
  console.log(`Starting bulk seeding of ${TAXONOMY_SEEDS.length} controlled taxonomies...`);

  const taxonomyData = TAXONOMY_SEEDS.map((item) => ({
    type: item.type,
    code: item.code,
    name: item.name,
    isActive: true,
  }));

  const res = await prisma.taxonomy.createMany({
    data: taxonomyData,
    skipDuplicates: true,
  });
  console.log(`Taxonomies created: ${res.count}`);

  const allTax = await prisma.taxonomy.findMany({
    select: { id: true, code: true },
  });
  const taxMap = new Map(allTax.map((t) => [t.code, t.id]));

  const aliasData: { taxonomyId: string; alias: string }[] = [];
  for (const item of TAXONOMY_SEEDS) {
    const taxId = taxMap.get(item.code);
    if (taxId && item.aliases) {
      for (const a of item.aliases) {
        aliasData.push({ taxonomyId: taxId, alias: a });
      }
    }
  }

  const aliasRes = await prisma.taxonomyAlias.createMany({
    data: aliasData,
    skipDuplicates: true,
  });
  console.log(`Aliases created: ${aliasRes.count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding taxonomies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
