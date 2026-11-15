import { PrismaClient, CourseLevel } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const CATEGORIES = [
  { id: 'CAT-01', name: 'Career Development & Employability', displayOrder: 1 },
  { id: 'CAT-02', name: 'Scholarships & Educational Advancement', displayOrder: 2 },
  { id: 'CAT-03', name: 'Leadership & People Management', displayOrder: 3 },
  { id: 'CAT-04', name: 'Project & Programme Management', displayOrder: 4 },
  { id: 'CAT-05', name: 'Research, Data & Evidence', displayOrder: 5 },
  { id: 'CAT-06', name: 'Monitoring, Evaluation & Learning', displayOrder: 6 },
  { id: 'CAT-07', name: 'Communication & Professional Effectiveness', displayOrder: 7 },
  { id: 'CAT-08', name: 'Entrepreneurship & Business Development', displayOrder: 8 },
  { id: 'CAT-09', name: 'Digital Skills, AI & Productivity', displayOrder: 9 },
  { id: 'CAT-10', name: 'Organizational Development & Strategy', displayOrder: 10 },
];

const QUESTIONS = [
  // CAT-01
  { code: 'Q01', catId: 'CAT-01', order: 1, text: 'I can identify career opportunities that align with my qualifications, interests and long-term goals.' },
  { code: 'Q02', catId: 'CAT-01', order: 2, text: 'I can prepare a professional CV or résumé that communicates my relevant skills and achievements.' },
  { code: 'Q03', catId: 'CAT-01', order: 3, text: 'I can communicate my strengths and experiences effectively during interviews or professional conversations.' },
  { code: 'Q04', catId: 'CAT-01', order: 4, text: 'I can develop and follow a realistic plan for achieving my career goals.' },
  { code: 'Q05', catId: 'CAT-01', order: 5, text: 'I can identify and approach people, networks or organizations that could support my career development.' },

  // CAT-02
  { code: 'Q06', catId: 'CAT-02', order: 1, text: 'I can identify scholarships or educational programmes that align with my academic background and goals.' },
  { code: 'Q07', catId: 'CAT-02', order: 2, text: 'I can interpret scholarship eligibility requirements and determine whether I qualify.' },
  { code: 'Q08', catId: 'CAT-02', order: 3, text: 'I can prepare a compelling personal statement or statement of purpose for an academic application.' },
  { code: 'Q09', catId: 'CAT-02', order: 4, text: 'I can organize the documents, references and deadlines required for a competitive scholarship application.' },
  { code: 'Q10', catId: 'CAT-02', order: 5, text: 'I can develop a realistic strategy for researching, preparing and submitting scholarship applications.' },

  // CAT-03
  { code: 'Q11', catId: 'CAT-03', order: 1, text: 'I can set clear goals and help others understand what they are expected to achieve.' },
  { code: 'Q12', catId: 'CAT-03', order: 2, text: 'I can provide constructive feedback that helps another person improve their performance.' },
  { code: 'Q13', catId: 'CAT-03', order: 3, text: 'I can resolve disagreements or differences of opinion within a team constructively.' },
  { code: 'Q14', catId: 'CAT-03', order: 4, text: 'I can delegate tasks effectively, giving others the support and authority they need to succeed.' },
  { code: 'Q15', catId: 'CAT-03', order: 5, text: 'I can motivate and encourage others when work becomes difficult or priorities change.' },

  // CAT-04
  { code: 'Q16', catId: 'CAT-04', order: 1, text: 'I can define the scope, deliverables and success criteria for a project.' },
  { code: 'Q17', catId: 'CAT-04', order: 2, text: 'I can create a realistic project schedule with clear milestones and dependencies.' },
  { code: 'Q18', catId: 'CAT-04', order: 3, text: 'I can identify risks that could affect a project and plan actions to address them.' },
  { code: 'Q19', catId: 'CAT-04', order: 4, text: 'I can monitor project progress, identify delays and take corrective action.' },
  { code: 'Q20', catId: 'CAT-04', order: 5, text: 'I can prepare clear progress reports that keep stakeholders informed about a project.' },

  // CAT-05
  { code: 'Q21', catId: 'CAT-05', order: 1, text: 'I can formulate clear research questions or hypotheses that guide an inquiry.' },
  { code: 'Q22', catId: 'CAT-05', order: 2, text: 'I can find, evaluate and synthesize relevant literature and published evidence.' },
  { code: 'Q23', catId: 'CAT-05', order: 3, text: 'I can choose and apply appropriate qualitative or quantitative research methods.' },
  { code: 'Q24', catId: 'CAT-05', order: 4, text: 'I can analyze data accurately and draw well-supported conclusions.' },
  { code: 'Q25', catId: 'CAT-05', order: 5, text: 'I can communicate research findings clearly in written reports or presentations.' },

  // CAT-06
  { code: 'Q26', catId: 'CAT-06', order: 1, text: 'I can design a theory of change or logical framework for a programme or intervention.' },
  { code: 'Q27', catId: 'CAT-06', order: 2, text: 'I can develop measurable indicators to track progress against intended outcomes.' },
  { code: 'Q28', catId: 'CAT-06', order: 3, text: 'I can collect and verify monitoring data systematically over the life of a project.' },
  { code: 'Q29', catId: 'CAT-06', order: 4, text: 'I can conduct or support an evaluation to assess programme effectiveness and impact.' },
  { code: 'Q30', catId: 'CAT-06', order: 5, text: 'I can use monitoring and evaluation findings to improve programme design and delivery.' },

  // CAT-07
  { code: 'Q31', catId: 'CAT-07', order: 1, text: 'I can write professional emails, memos and short reports that are clear and concise.' },
  { code: 'Q32', catId: 'CAT-07', order: 2, text: 'I can deliver engaging presentations tailored to the needs of different audiences.' },
  { code: 'Q33', catId: 'CAT-07', order: 3, text: 'I can listen actively and understand the perspectives and concerns of colleagues.' },
  { code: 'Q34', catId: 'CAT-07', order: 4, text: 'I can manage my time and prioritize tasks to meet competing commitments consistently.' },
  { code: 'Q35', catId: 'CAT-07', order: 5, text: 'I can maintain professional relationships across different teams, functions and levels.' },

  // CAT-08
  { code: 'Q36', catId: 'CAT-08', order: 1, text: 'I can identify and validate market opportunities or unmet customer needs.' },
  { code: 'Q37', catId: 'CAT-08', order: 2, text: 'I can develop a viable business model that explains how a venture creates and captures value.' },
  { code: 'Q38', catId: 'CAT-08', order: 3, text: 'I can prepare a basic financial plan or budget for a new initiative or enterprise.' },
  { code: 'Q39', catId: 'CAT-08', order: 4, text: 'I can pitch an idea, product or venture persuasively to potential customers or investors.' },
  { code: 'Q40', catId: 'CAT-08', order: 5, text: 'I can identify and adapt to market feedback or changing business conditions.' },

  // CAT-09
  { code: 'Q41', catId: 'CAT-09', order: 1, text: 'I can use modern productivity tools and collaborative software effectively in my work.' },
  { code: 'Q42', catId: 'CAT-09', order: 2, text: 'I can use spreadsheets to organize, calculate and visualize information accurately.' },
  { code: 'Q43', catId: 'CAT-09', order: 3, text: 'I can evaluate and use generative AI tools responsibly to improve personal productivity.' },
  { code: 'Q44', catId: 'CAT-09', order: 4, text: 'I can manage digital files, assets and data securely and systematically.' },
  { code: 'Q45', catId: 'CAT-09', order: 5, text: 'I can identify and learn new digital tools and technologies independently.' },

  // CAT-10
  { code: 'Q46', catId: 'CAT-10', order: 1, text: 'I can assess an organization’s strategic position, strengths and areas for development.' },
  { code: 'Q47', catId: 'CAT-10', order: 2, text: 'I can contribute to developing strategic plans that align with organizational objectives.' },
  { code: 'Q48', catId: 'CAT-10', order: 3, text: 'I can identify opportunities to improve operational processes and organizational systems.' },
  { code: 'Q49', catId: 'CAT-10', order: 4, text: 'I can support change initiatives and help colleagues adapt to new ways of working.' },
  { code: 'Q50', catId: 'CAT-10', order: 5, text: 'I can align day-to-day team activities with wider organizational priorities.' },
];

const SAMPLE_COURSES = [
  {
    courseCode: 'SA-001',
    categoryId: 'CAT-07',
    title: 'Professional Email & Workplace Communication',
    level: CourseLevel.ESSENTIALS,
    priceNGN: 0,
    isFree: true,
    duration: '2 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-001-professional-email-and-workplace-communi',
  },
  {
    courseCode: 'SA-002',
    categoryId: 'CAT-01',
    title: 'CV & Cover Letter Essentials',
    level: CourseLevel.ESSENTIALS,
    priceNGN: 0,
    isFree: true,
    duration: '3 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-002-cv-and-cover-letter-essentials',
  },
  {
    courseCode: 'SA-003',
    categoryId: 'CAT-01',
    title: 'Building a Strong LinkedIn Profile',
    level: CourseLevel.ESSENTIALS,
    priceNGN: 0,
    isFree: true,
    duration: '2 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-003-building-a-strong-linkedin-profile',
  },
  {
    courseCode: 'SA-005',
    categoryId: 'CAT-01',
    title: 'Interview Preparation & Techniques',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 15000,
    isFree: false,
    duration: '4 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-005-interview-prep',
  },
  {
    courseCode: 'SA-006',
    categoryId: 'CAT-02',
    title: 'Finding the Right Scholarship',
    level: CourseLevel.ESSENTIALS,
    priceNGN: 0,
    isFree: true,
    duration: '3 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-006-finding-the-right-scholarship',
  },
  {
    courseCode: 'SA-007',
    categoryId: 'CAT-02',
    title: 'Crafting Winning Scholarship Essays',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 0,
    isFree: true, // Always free in CAT-02
    duration: '4 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-007-scholarship-essays',
  },
  {
    courseCode: 'SA-008',
    categoryId: 'CAT-02',
    title: 'Academic References & Research Proposals',
    level: CourseLevel.ADVANCED,
    priceNGN: 0,
    isFree: true, // Always free in CAT-02
    duration: '6 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-008-research-proposals',
  },
  {
    courseCode: 'SA-011',
    categoryId: 'CAT-03',
    title: 'Principles of Effective Leadership',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 20000,
    isFree: false,
    duration: '5 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-011-principles-leadership',
  },
  {
    courseCode: 'SA-016',
    categoryId: 'CAT-04',
    title: 'Project Management Essentials',
    level: CourseLevel.ESSENTIALS,
    priceNGN: 0,
    isFree: true,
    duration: '4 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-016-project-management-essentials',
  },
  {
    courseCode: 'SA-021',
    categoryId: 'CAT-05',
    title: 'Foundations of Evidence & Applied Research',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 25000,
    isFree: false,
    duration: '6 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-021-foundations-research',
  },
  {
    courseCode: 'SA-026',
    categoryId: 'CAT-06',
    title: 'Monitoring & Evaluation Frameworks',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 20000,
    isFree: false,
    duration: '5 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-026-mel-frameworks',
  },
  {
    courseCode: 'SA-031',
    categoryId: 'CAT-07',
    title: 'High-Impact Presentation Skills',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 15000,
    isFree: false,
    duration: '3 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-031-presentation-skills',
  },
  {
    courseCode: 'SA-036',
    categoryId: 'CAT-08',
    title: 'Venture Creation & Business Modeling',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 25000,
    isFree: false,
    duration: '6 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-036-venture-creation',
  },
  {
    courseCode: 'SA-041',
    categoryId: 'CAT-09',
    title: 'AI & Digital Productivity Masterclass',
    level: CourseLevel.FUNDAMENTALS,
    priceNGN: 18000,
    isFree: false,
    duration: '4 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-041-ai-productivity',
  },
  {
    courseCode: 'SA-046',
    categoryId: 'CAT-10',
    title: 'Strategic Thinking & Organizational Execution',
    level: CourseLevel.ADVANCED,
    priceNGN: 30000,
    isFree: false,
    duration: '8 hours',
    enrollmentUrl: 'https://learn.sterlinglrs.com/courses/sa-046-strategic-execution',
  },
];

async function main() {
  console.log('--- SEEDING STERLING CONNECT DATABASE ---');
  console.log('Using DATABASE_URL:', (process.env.DATABASE_URL || '').replace(/:[^:]*@/, ':****@'));

  // 1. Seed Categories
  console.log('1. Seeding 10 Academy Categories...');
  for (const cat of CATEGORIES) {
    await prisma.academyCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: { id: cat.id, name: cat.name, displayOrder: cat.displayOrder },
    });
  }

  // 2. Seed Assessment Version 1.0
  console.log('2. Seeding Assessment Version 1.0...');
  const version = await prisma.assessmentVersion.upsert({
    where: { versionNumber: '1.0' },
    update: { status: 'PUBLISHED' },
    create: {
      versionNumber: '1.0',
      status: 'PUBLISHED',
      title: 'Sterling Universal 10-Category Readiness Diagnostic',
      description: '50-statement self-reported diagnostic across 10 core development dimensions.',
    },
  });

  // 3. Seed 50 Questions
  console.log('3. Seeding 50 Diagnostic Questions...');
  let globalOrder = 1;
  for (const q of QUESTIONS) {
    const cat = CATEGORIES.find((c) => c.id === q.catId);
    await prisma.assessmentQuestion.upsert({
      where: {
        versionId_questionCode: {
          versionId: version.id,
          questionCode: q.code,
        },
      },
      update: {
        statement: q.text,
        orderInCategory: q.order,
        orderIndex: globalOrder,
        categoryId: q.catId,
        categoryName: cat?.name || q.catId,
      },
      create: {
        versionId: version.id,
        questionCode: q.code,
        categoryId: q.catId,
        categoryName: cat?.name || q.catId,
        statement: q.text,
        orderIndex: globalOrder,
        orderInCategory: q.order,
        construct: 'Self-report capability',
      },
    });
    globalOrder++;
  }

  // 4. Seed Academy Courses
  console.log('4. Seeding Academy Course Catalogue...');
  for (const c of SAMPLE_COURSES) {
    await prisma.academyCourse.upsert({
      where: { courseCode: c.courseCode },
      update: {
        title: c.title,
        categoryId: c.categoryId,
        level: c.level,
        priceNGN: c.priceNGN,
        isFree: c.isFree,
        duration: c.duration,
        enrollmentUrl: c.enrollmentUrl,
      },
      create: {
        courseCode: c.courseCode,
        title: c.title,
        categoryId: c.categoryId,
        level: c.level,
        priceNGN: c.priceNGN,
        isFree: c.isFree,
        duration: c.duration,
        enrollmentUrl: c.enrollmentUrl,
      },
    });
  }

  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
