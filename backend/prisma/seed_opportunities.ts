import { PrismaClient, OpportunityType, OpportunityStatus, WorkArrangement, FundingLevel } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Resolved DATABASE_URL exists:', !!process.env.DATABASE_URL);

const prisma = new PrismaClient();

const OPPORTUNITIES_DATA = [
  // 1. Chevening Scholarship 2027
  {
    referenceCode: 'SCH-0001',
    opportunityType: OpportunityType.SCHOLARSHIP,
    title: 'Chevening Scholarship 2027',
    organization: 'UK Foreign, Commonwealth & Development Office',
    country: 'United Kingdom',
    location: 'Multiple UK Universities',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-11-30T23:59:59Z'),
    openingDate: new Date('2026-08-01T00:00:00Z'),
    applicationUrl: 'https://www.chevening.org/scholarships',
    sourceUrl: 'https://www.gov.uk/chevening-scholarships',
    isFeatured: true,
    overview:
      'Chevening is the UK government’s international awards programme aimed at developing global leaders. It offers fully funded Master’s degrees across any UK university for individuals with demonstrable leadership potential.',
    requirements:
      'Undergraduate degree equivalent to an upper second-class (2:1) honours degree in the UK.\nCitizen of a Chevening-eligible country or territory.\nAt least two years (equivalent to 2,800 hours) of demonstrable professional work experience.\nCommitment to return to country of citizenship for a minimum of two years after award.\nUnconditional offer from at least one of three eligible UK Master’s courses.',
    scholarshipDetail: {
      studyLevels: ["Master's Degree"],
      eligibleNationalities: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'Rwanda', 'Tanzania', 'Egypt'],
      eligibleFields: ['All Fields'],
      academicRequirement: 'Second Class Upper (2:1 / GPA 3.0+)',
      fundingLevel: FundingLevel.FULLY_FUNDED,
      languageRequirement: 'Exempt or verified university English offer',
      programStartYear: 2027,
    },
  },

  // 2. Mastercard Foundation Scholars Program at Oxford
  {
    referenceCode: 'SCH-0002',
    opportunityType: OpportunityType.SCHOLARSHIP,
    title: 'Mastercard Foundation Scholars Program at Oxford',
    organization: 'Mastercard Foundation & University of Oxford',
    country: 'United Kingdom',
    location: 'University of Oxford',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-12-15T23:59:59Z'),
    openingDate: new Date('2026-09-01T00:00:00Z'),
    applicationUrl: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarships/mastercard-foundation',
    sourceUrl: 'https://mastercardfdn.org/all/scholars',
    isFeatured: true,
    overview:
      'Provides full-cost scholarships to young people from across Africa to pursue graduate study at Oxford. Targets exceptional scholars who demonstrate financial need and commitment to contributing to transformative leadership in Africa.',
    requirements:
      'Citizen of an African country, ordinarily resident in Africa.\nFirst-class or strong upper second-class undergraduate degree.\nDemonstrated commitment to the development of Africa through community engagement or social innovation.\nFinancial disadvantage or experience of displacement/conflict.',
    scholarshipDetail: {
      studyLevels: ["Master's Degree"],
      eligibleNationalities: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda', 'Uganda', 'Tanzania', 'All African Nations'],
      eligibleFields: ['Economics & Development Studies', 'Public Policy & International Relations', 'Computer Science & Software Engineering', 'Public Health & Medicine'],
      academicRequirement: 'First Class Honours (or GPA 3.8+)',
      fundingLevel: FundingLevel.FULLY_FUNDED,
      languageRequirement: 'IELTS 7.5 or Oxford Waiver',
      programStartYear: 2027,
    },
  },

  // 3. DAAD Postgraduate Scholarships (Germany)
  {
    referenceCode: 'SCH-0003',
    opportunityType: OpportunityType.SCHOLARSHIP,
    title: 'DAAD Development-Related Postgraduate Scholarships (EPOS)',
    organization: 'German Academic Exchange Service (DAAD)',
    country: 'Germany',
    location: 'State-accredited German Universities',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-11-20T23:59:59Z'),
    openingDate: new Date('2026-06-01T00:00:00Z'),
    applicationUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships',
    sourceUrl: 'https://www2.daad.de',
    isFeatured: false,
    overview:
      'Offers foreign graduates from developing and newly industrialized countries with at least two years of professional experience the chance to take a postgraduate or Master’s degree at a state-recognized German university.',
    requirements:
      'Bachelor degree completed not more than six years ago.\nAt least two years of relevant professional experience in development or public sector.\nEnglish or German proficiency certificate depending on programme language.',
    scholarshipDetail: {
      studyLevels: ["Master's Degree", 'Doctorate / PhD'],
      eligibleNationalities: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'All Developing Nations'],
      eligibleFields: ['Economics & Development Studies', 'Engineering & Technology', 'Environmental & Agricultural Sciences', 'Public Health & Medicine'],
      academicRequirement: 'Upper Second Class (2:1)',
      fundingLevel: FundingLevel.FULLY_FUNDED,
      languageRequirement: 'IELTS 6.0 or TOEFL iBT 80',
      programStartYear: 2027,
    },
  },

  // 4. Commonwealth Master's Scholarships
  {
    referenceCode: 'SCH-0004',
    opportunityType: OpportunityType.SCHOLARSHIP,
    title: 'Commonwealth Master’s Scholarships in the UK',
    organization: 'Commonwealth Scholarship Commission',
    country: 'United Kingdom',
    location: 'UK Universities',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-10-18T23:59:59Z'), // Recently closed/past deadline test
    openingDate: new Date('2026-07-01T00:00:00Z'),
    applicationUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships',
    sourceUrl: 'https://cscuk.fcdo.gov.uk',
    isFeatured: false,
    overview:
      'Enables talented and motivated individuals to gain the knowledge and skills required for sustainable development, aimed at those who could not otherwise afford to study in the UK.',
    requirements:
      'Citizen of or granted refugee status by an eligible Commonwealth country.\nPermanently resident in an eligible Commonwealth country.\nAvailable to start academic studies in the UK by September 2027.\nHold a first degree of at least upper second-class (2:1) standard.',
    scholarshipDetail: {
      studyLevels: ["Master's Degree"],
      eligibleNationalities: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'Rwanda', 'All Commonwealth Developing'],
      eligibleFields: ['Science and Technology for Development', 'Strengthening Health Systems', 'Promoting Global Prosperity', 'Strengthening Global Peace'],
      academicRequirement: 'Second Class Upper (2:1)',
      fundingLevel: FundingLevel.FULLY_FUNDED,
      languageRequirement: 'Exempt',
      programStartYear: 2027,
    },
  },

  // 5. Commonwealth STEM Fellowship
  {
    referenceCode: 'SCH-0005',
    opportunityType: OpportunityType.SCHOLARSHIP,
    title: 'Commonwealth Science & Technology Research Fellowship',
    organization: 'Commonwealth Scholarship Commission & Imperial College',
    country: 'United Kingdom',
    location: 'Imperial College London & Manchester',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-12-20T23:59:59Z'),
    openingDate: new Date('2026-09-01T00:00:00Z'),
    applicationUrl: 'https://cscuk.fcdo.gov.uk/scholarships',
    sourceUrl: 'https://cscuk.fcdo.gov.uk',
    isFeatured: false,
    overview:
      'Rigorous research fellowship explicitly dedicated to Science, Technology, Engineering and Mathematics (STEM) graduates.',
    requirements:
      'Undergraduate qualification strictly in a STEM discipline.\nPermanent resident of a Commonwealth developing nation.\nResearch proposal submitted and pre-endorsed by a UK faculty member.',
    scholarshipDetail: {
      studyLevels: ["Master's Degree", 'Doctorate / PhD'],
      eligibleNationalities: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda'],
      eligibleFields: ['Computer Science & Software Engineering', 'Data Science & Artificial Intelligence', 'Mechanical & Civil Engineering', 'Biological & Chemical Sciences'],
      academicRequirement: 'First Class Honours (or GPA 3.8+)',
      fundingLevel: FundingLevel.FULLY_FUNDED,
      languageRequirement: 'IELTS 7.0',
      programStartYear: 2027,
    },
  },

  // 6. Graduate Finance & Investment Analyst
  {
    referenceCode: 'EMP-0001',
    opportunityType: OpportunityType.EMPLOYMENT,
    title: 'Graduate Finance & Investment Analyst',
    organization: 'Standard Investment & Capital Partners',
    country: 'Kenya',
    location: 'Nairobi (Hybrid)',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-12-05T23:59:59Z'),
    openingDate: new Date('2026-10-01T00:00:00Z'),
    applicationUrl: 'https://careers.standardcapital.example/analyst',
    sourceUrl: 'https://standardcapital.example',
    isFeatured: true,
    overview:
      'Fast-track analyst role within the private equity and financial consulting arm. The analyst conducts financial modeling, evaluates investment feasibility, and prepares pitch materials for cross-border African transactions.',
    requirements:
      'Degree in Finance, Economics, Business Administration, or Engineering.\n0–3 years of professional experience (fresh graduates with strong academic credentials welcome).\nAdvanced proficiency in Microsoft Excel and financial valuation concepts.\nStrong quantitative reasoning and business writing skills.',
    employmentDetail: {
      subType: 'Graduate programme',
      sector: 'Finance & Banking',
      function: 'Operations & Project Management',
      workArrangement: WorkArrangement.HYBRID,
      experienceLevel: 'Entry-level',
      minimumEducation: "Bachelor's Degree",
      eligibleNationalities: ['All'],
      requiredSkills: ['Financial Modelling', 'Research & Analysis', 'Strategic Planning', 'Communication'],
      compensationRange: 'KES 180,000 - 240,000 / month',
    },
  },

  // 7. Associate Programme Officer (Education & Skills)
  {
    referenceCode: 'EMP-0002',
    opportunityType: OpportunityType.EMPLOYMENT,
    title: 'Associate Programme Officer (Education & Skills)',
    organization: 'Global Development & Education Foundation',
    country: 'Switzerland',
    location: 'Remote (Global)',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-11-28T23:59:59Z'),
    openingDate: new Date('2026-09-15T00:00:00Z'),
    applicationUrl: 'https://example-globaldev.org/careers/programme-officer',
    sourceUrl: 'https://example-globaldev.org',
    isFeatured: true,
    overview:
      'Coordinates international grant management, monitors educational partner KPIs across Sub-Saharan Africa, and prepares quarterly multilateral impact assessments.',
    requirements:
      '1–3 years of experience in project management, development cooperation, or non-profit monitoring.\nBachelor’s or Master’s in Social Sciences, Public Policy, or International Development.\nDemonstrated familiarity with Theory of Change and logical framework matrices.\nFluency in written and spoken English.',
    employmentDetail: {
      subType: 'Full-time',
      sector: 'Development & Non-Profit',
      function: 'Operations & Project Management',
      workArrangement: WorkArrangement.REMOTE,
      experienceLevel: 'Entry-level',
      minimumEducation: "Bachelor's Degree",
      eligibleNationalities: ['All'],
      requiredSkills: ['Project Management', 'Communication', 'Research & Analysis'],
      compensationRange: '$45,000 - $55,000 / year',
    },
  },

  // 8. Junior Data Science & Analytics Fellow
  {
    referenceCode: 'EMP-0003',
    opportunityType: OpportunityType.EMPLOYMENT,
    title: 'Junior Data Science & Analytics Fellow',
    organization: 'AfriPay FinTech Labs',
    country: 'Nigeria',
    location: 'Lagos (Hybrid)',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-12-10T23:59:59Z'),
    openingDate: new Date('2026-10-10T00:00:00Z'),
    applicationUrl: 'https://afripay.example/fellowships',
    sourceUrl: 'https://afripay.example',
    isFeatured: false,
    overview:
      'A 12-month paid fellowship working directly alongside senior data engineers to build fraud-detection models and analyze transaction volume across West Africa.',
    requirements:
      'Proficiency in SQL and Python for data analysis.\nDegree in Computer Science, Mathematics, Economics, or related quantitative field.\nExperience organizing messy data and presenting clear visualization dashboards.',
    employmentDetail: {
      subType: 'Fellowship',
      sector: 'Technology & Software',
      function: 'Data & Analytics',
      workArrangement: WorkArrangement.HYBRID,
      experienceLevel: 'Entry-level',
      minimumEducation: "Bachelor's Degree",
      eligibleNationalities: ['Nigeria', 'All'],
      requiredSkills: ['Research & Analysis', 'Strategic Planning', 'Communication'],
      compensationRange: '₦350,000 - ₦450,000 / month',
    },
  },

  // 9. Policy & Economic Research Associate (Strict UK Work Auth)
  {
    referenceCode: 'EMP-0004',
    opportunityType: OpportunityType.EMPLOYMENT,
    title: 'Policy & Economic Research Associate',
    organization: 'Chatham Policy Institute',
    country: 'United Kingdom',
    location: 'London (On-site)',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-11-25T23:59:59Z'),
    openingDate: new Date('2026-09-20T00:00:00Z'),
    applicationUrl: 'https://chathampolicy.example/jobs/associate',
    sourceUrl: 'https://chathampolicy.example',
    isFeatured: false,
    overview:
      'Conducts comparative policy analysis on multilateral trade frameworks. Note: The employer does not offer visa sponsorship for this role; applicants must have existing legal right to work in the UK.',
    requirements:
      'Must have existing unrestricted legal right to work in the United Kingdom (no visa sponsorship provided).\nMaster’s degree in Public Policy, Economics, or International Relations.\nProven writing samples in trade or diplomatic policy.',
    employmentDetail: {
      subType: 'Full-time',
      sector: 'Consulting & Strategy',
      function: 'Operations & Project Management',
      workArrangement: WorkArrangement.ONSITE,
      experienceLevel: 'Mid-level',
      minimumEducation: "Master's Degree",
      eligibleNationalities: ['United Kingdom'], // Strict UK work authorization
      requiredSkills: ['Strategic Planning', 'Research & Analysis', 'Communication'],
      compensationRange: '£36,000 - £42,000 / year',
    },
  },

  // 10. Operations & Project Management Associate
  {
    referenceCode: 'EMP-0005',
    opportunityType: OpportunityType.EMPLOYMENT,
    title: 'Operations & Project Management Associate',
    organization: 'Sterling Global Solutions',
    country: 'Nigeria',
    location: 'Abuja (Hybrid)',
    status: OpportunityStatus.PUBLISHED,
    deadline: new Date('2026-12-31T23:59:59Z'),
    openingDate: new Date('2026-10-15T00:00:00Z'),
    applicationUrl: 'https://sterlinglrs.com/careers/ops-associate',
    sourceUrl: 'https://sterlinglrs.com',
    isFeatured: true,
    overview:
      'Drive day-to-day project operations, stakeholder engagement, and project milestone tracking for enterprise transformation initiatives across West Africa.',
    requirements:
      'Bachelor’s degree in Management, Social Sciences, Engineering or related.\n1–3 years of project coordination experience.\nProficient in project scheduling tools, Excel, and stakeholder communications.',
    employmentDetail: {
      subType: 'Full-time',
      sector: 'Consulting & Strategy',
      function: 'Operations & Project Management',
      workArrangement: WorkArrangement.HYBRID,
      experienceLevel: 'Entry-level',
      minimumEducation: "Bachelor's Degree",
      eligibleNationalities: ['All'],
      requiredSkills: ['Project Management', 'Communication', 'Strategic Planning'],
      compensationRange: '₦400,000 - ₦550,000 / month',
    },
  },
];

async function main() {
  console.log('--- SEEDING OPPORTUNITIES ---');
  for (const item of OPPORTUNITIES_DATA) {
    const { scholarshipDetail, employmentDetail, ...oppData } = item;

    const opp = await prisma.opportunity.upsert({
      where: { referenceCode: oppData.referenceCode },
      update: {
        ...oppData,
      },
      create: {
        ...oppData,
      },
    });

    if (scholarshipDetail) {
      await prisma.scholarshipOpportunityDetail.upsert({
        where: { opportunityId: opp.id },
        update: {
          ...scholarshipDetail,
        },
        create: {
          opportunityId: opp.id,
          ...scholarshipDetail,
        },
      });
    }

    if (employmentDetail) {
      await prisma.employmentOpportunityDetail.upsert({
        where: { opportunityId: opp.id },
        update: {
          ...employmentDetail,
        },
        create: {
          opportunityId: opp.id,
          ...employmentDetail,
        },
      });
    }

    console.log(`Seeded Opportunity: [${opp.referenceCode}] ${opp.title}`);
  }

  const count = await prisma.opportunity.count();
  console.log(`Total Opportunities in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error('Failed to seed opportunities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
