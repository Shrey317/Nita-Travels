import { beforeAll, afterAll } from 'vitest';
import { verifyTestEnvironment } from './lib/db/safety';
import { prisma } from './lib/db/client';

beforeAll(async () => {
  await verifyTestEnvironment(true);
  // Each sequential suite owns an empty fixture set inside the runner's disposable schema.
  // Otherwise whole-fleet aggregates depend on which test file Vitest schedules first.
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.mileageEntry.deleteMany(),
    prisma.vehicleNote.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.rateLimit.deleteMany(),
  ]);
});
afterAll(() => prisma.$disconnect());
