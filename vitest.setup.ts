import { beforeAll, afterAll } from 'vitest';
import { verifyTestEnvironment } from './lib/db/safety';
import { prisma } from './lib/db/client';

beforeAll(() => verifyTestEnvironment(true));
afterAll(() => prisma.$disconnect());
