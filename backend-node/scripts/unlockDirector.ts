import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockDirector() {
  await prisma.user.update({
    where: { email: 'director@example.com' },
    data: {
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      accessBlockedUntil: null,
      accessBlockReason: null,
    },
  });
  console.log('Director account unlocked and reset.');
  await prisma.$disconnect();
}

unlockDirector().catch((err) => {
  console.error('Error unlocking director:', err);
  prisma.$disconnect();
});
