import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'director@example.com' },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });
  console.log('Director account unlocked.');
}

main().finally(() => prisma.$disconnect());
