import { verifyTestEnvironment } from '../lib/db/safety';
import { prisma } from '../lib/db/client';
import { seedTestFixtures } from '../scripts/test-fixtures';

export default async function globalSetup() {
  await verifyTestEnvironment(true);
  await seedTestFixtures(prisma);
  await prisma.$disconnect();
}
