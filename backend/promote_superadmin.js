const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'amaefulemercy499@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN', status: 'ACTIVE', isEmailVerified: true },
    });
    console.log(`✅ User ${updated.email} elevated to role: ${updated.role}`);
  } else {
    console.log(`ℹ️ User ${email} does not exist yet. You can sign up with this email or use the admin account.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
