import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('engineer123', 12);
  await prisma.user.upsert({
    where: { email: 'engineer@eleccalc.pro' },
    update: {},
    create: {
      email: 'engineer@eleccalc.pro',
      password,
      name: 'Demo Engineer',
      company: 'ElecCalc Pro',
      role: 'engineer',
      settings: {
        create: {
          theme: 'dark',
          unitSystem: 'metric',
          standard: 'IEC',
          engineerName: 'Demo Engineer',
          companyName: 'ElecCalc Pro',
          autoSave: true,
        },
      },
    },
  });
  console.log('✅ Demo user seeded: engineer@eleccalc.pro / engineer123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
