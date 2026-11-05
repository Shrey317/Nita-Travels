import { PrismaClient } from '@prisma/client';

// Read-only deployment preflight. Never creates tables or changes migration history.
const client = new PrismaClient();
async function main() {
  const tables = await client.$queryRaw<Array<{ table_name: string }>>`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name IN ('StaffAccount', '_prisma_migrations')`;
  if (!tables.some(table => table.table_name === 'StaffAccount')) {
    console.info('StaffAccount is absent. Apply the normal migration chain before starting the application.');
    return;
  }
  const columns = await client.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'StaffAccount'`;
  const expected: Record<string, string> = { id: 'text', email: 'text', name: 'text', passwordHash: 'text', status: 'text', sessionVersion: 'integer', createdAt: 'timestamp without time zone', updatedAt: 'timestamp without time zone' };
  if (columns.length !== Object.keys(expected).length || columns.some(column => expected[column.column_name] !== column.data_type || column.is_nullable !== 'NO')) throw new Error('Unexpected staff table shape');
  const constraints = await client.$queryRaw<Array<{ definition: string; valid: boolean }>>`SELECT pg_get_constraintdef(oid) AS definition, convalidated AS valid FROM pg_constraint WHERE conrelid = to_regclass('"StaffAccount"')`;
  const indexes = await client.$queryRaw<Array<{ indexdef: string }>>`SELECT indexdef FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'StaffAccount'`;
  if (!constraints.some(row => row.valid && row.definition === 'PRIMARY KEY (id)') ||
      !constraints.some(row => row.valid && row.definition.includes('CHECK') && ['PENDING', 'ACTIVE', 'DISABLED'].every(status => row.definition.includes(status))) ||
      !indexes.some(row => /CREATE UNIQUE INDEX/.test(row.indexdef) && /\(email\)$/.test(row.indexdef))) throw new Error('Expected staff constraints are absent');
  const history = tables.some(table => table.table_name === '_prisma_migrations')
    ? await client.$queryRaw<Array<{ finished_at: Date | null; rolled_back_at: Date | null }>>`SELECT finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration_name = '20261030090000_staff_accounts'`
    : [];
  if (history.some(row => row.finished_at && !row.rolled_back_at)) {
    console.info('StaffAccount migration is recorded and the required table structure is present.');
    return;
  }
  console.error('StaffAccount exists without a completed migration. Stop deployment and follow docs/staff-migration-recovery.md. No data or migration records were changed.');
  process.exitCode = 2;
}
main().catch(() => {
  console.error('Staff migration verification failed. Check database access and schema using docs/staff-migration-recovery.md. Connection details are omitted.');
  process.exitCode = 1;
}).finally(() => client.$disconnect());
