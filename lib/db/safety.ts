import { prisma } from './client';
import { assertTestEnvironment } from '../test-environment';

export async function verifyTestEnvironment(requireDestructive = false) {
  const expected = assertTestEnvironment(process.env, requireDestructive);
  const rows = await prisma.$queryRaw<Array<{ db: string; schema: string }>>`
    SELECT current_database() AS db, current_schema() AS schema
  `;
  const identity = rows[0];
  if (!identity || identity.db !== expected.database || identity.schema !== expected.schema) {
    throw new Error('SAFETY ABORT: The connected database/schema differs from the isolated test target.');
  }
  return { dbName: identity.db, schema: identity.schema };
}

export async function verifyProductionReadOnly() {
  if (process.env.APP_ENV === 'test') throw new Error('SAFETY ABORT: Expected a non-test environment.');
  const rows = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
  if (!rows[0]) throw new Error('SAFETY ABORT: Could not verify database identity.');
  return { dbName: rows[0].db };
}
