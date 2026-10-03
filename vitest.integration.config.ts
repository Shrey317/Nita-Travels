import { defineConfig } from 'vitest/config';
import path from 'path';
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/integration/**/*.test.ts', '__tests__/weekly.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
