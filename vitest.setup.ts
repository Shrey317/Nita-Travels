import { beforeAll, afterAll } from 'vitest';
import { verifyTestEnvironment } from './lib/db/safety';
import { prisma } from './lib/db/client';

beforeAll(async () => {
  await verifyTestEnvironment(true);
  // The runner gives each suite a fresh schema and retains all synthetic records.
});
afterAll(() => prisma.$disconnect());
