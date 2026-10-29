import { expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { transactionCsvChunks } from '@/lib/db/transactions';

it('streams every matching row across batch boundaries with deterministic same-day order', async () => {
  await prisma.transaction.createMany({ data: Array.from({ length: 1001 }, (_, i) => ({
    id: `export-${String(i).padStart(4, '0')}`, date: new Date('2026-01-02'), category: 'Income' as const,
    incomeZarCents: 101, notes: `row-${i}`, vehicleId: null,
  })) });
  const chunks: string[] = [];
  for await (const chunk of transactionCsvChunks()) chunks.push(chunk);
  expect(chunks).toHaveLength(3);
  const lines = chunks.join('').split('\n');
  expect(lines).toHaveLength(1002);
  expect(lines[1]).toContain('row-0');
  expect(lines[1001]).toContain('row-1000');
  expect(new Set(lines.slice(1)).size).toBe(1001);
});
