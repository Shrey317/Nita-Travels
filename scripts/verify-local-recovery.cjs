const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const url = process.env.RECOVERY_DATABASE_URL;
if (!url) throw new Error('RECOVERY_DATABASE_URL is required.');
const target = new URL(url);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !target.pathname.startsWith('/nita_restore_')) {
  throw new Error('Recovery verification requires a named local recovery database.');
}
const expected = JSON.parse(fs.readFileSync('backups/approvals-before-repair.json', 'utf8'));
const client = new PrismaClient({ datasources: { db: { url } } });
(async () => {
  for (const table of ['StaffAccount', 'Vehicle', 'Transaction', 'MileageEntry', 'VehicleNote']) {
    const actual = await client.$queryRawUnsafe(
      `SELECT count(*)::int AS count, md5(coalesce(string_agg(row_to_json(t)::text, '' ORDER BY id),'')) AS fingerprint FROM "${table}" t`
    );
    if (JSON.stringify(actual) !== JSON.stringify(expected[table])) throw new Error('Recovered records differ from the backup manifest.');
    console.info(`${table}: restored content verified (${actual[0].count} records).`);
  }
})().catch(() => {
  console.error('Recovery verification failed. Connection and record details omitted.');
  process.exitCode = 1;
}).finally(() => client.$disconnect());
