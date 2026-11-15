const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sterlingconnect.com';
  const password = 'AdminPassword123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      hasCompletedAssessment: true,
    },
    create: {
      email,
      passwordHash,
      firstName: 'Sterling',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      hasCompletedAssessment: true,
      activePathway: 'EMPLOYMENT',
      commonProfile: {
        create: {
          locationCountry: 'United Kingdom',
          nationalities: ['British'],
          highestQualification: 'Master\'s Degree',
          fieldOfStudy: 'Platform Operations',
          profileCompletion: 100.0,
        },
      },
    },
  });

  console.log(`✅ Default Super Admin user ready: ${admin.email} (Password: ${password})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
