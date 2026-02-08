import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const director = await prisma.user.findUnique({
    where: { email: 'director@example.com' },
  });
  console.log(director);
}

main().finally(() => prisma.$disconnect());
