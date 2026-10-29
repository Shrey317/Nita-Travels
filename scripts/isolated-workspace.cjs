const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Copy source only: Next must never discover real application dotenv files during tests.
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.local-verification');
const files = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))];
fs.mkdirSync(destination, { recursive: true });
for (const file of files) {
  if (file.split('/').some(part => part.startsWith('.env') || part.startsWith('.local-')) || /^(docs|test-results|playwright-report)\//.test(file)) continue;
  const target = path.resolve(destination, file);
  if (!target.startsWith(destination + path.sep)) throw new Error('Source path outside isolated workspace');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
const modules = path.join(destination, 'node_modules');
if (!fs.existsSync(modules)) fs.symlinkSync(path.join(root, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
console.info('Isolated source workspace prepared without application environment files.');
