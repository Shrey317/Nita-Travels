const { spawnSync } = require('node:child_process');

// Builds never mutate schema. Apply reviewed migrations as an explicit release step.
if (process.env.VERCEL_ENV === 'production' && (!process.env.DATABASE_URL || !process.env.DIRECT_URL)) {
  console.error('Release blocked: production database connections must be configured.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'status'], {
  env: process.env, encoding: 'utf8', timeout: 60000,
});
if (result.error || result.status !== 0) {
  console.error('Release blocked: database migrations are pending, failed, or unavailable. Back up the intended database, review and apply committed migrations, then rebuild. Connection details omitted.');
  process.exit(1);
}
console.info('Release migration check passed.');
