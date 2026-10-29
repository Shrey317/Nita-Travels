import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';

describe('legacy migration preservation', () => {
  it('retains legacy IDs, cents, dates, references and attachment order through later migrations', async () => {
    const schema = `nita_test_legacy_${randomBytes(6).toString('hex')}`;
    const migrations = readdirSync('prisma/migrations').filter(name => /^\d/.test(name)).sort();
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      async function apply(name: string) {
        for (const statement of readFileSync(join('prisma/migrations', name, 'migration.sql'), 'utf8').split(';').filter(part => part.trim())) await tx.$executeRawUnsafe(statement);
      }
      for (const name of migrations.slice(0, 2)) await apply(name);
      await tx.$executeRaw`INSERT INTO "Vehicle" (id, make, model, registration, transmission, "purchaseDate", "purchasePriceCents", "mileageAtPurchaseKm", "updatedAt", active) VALUES ('CR85', 'Synthetic', 'Legacy', 'TEST', 'Manual', '2024-02-29', 1234567, 10000, NOW(), false)`;
      await tx.$executeRaw`INSERT INTO "Transaction" (id, date, "vehicleId", category, "incomeZarCents", "expenseZarCents", "photoUrls", "updatedAt") VALUES ('legacy-one', '2024-02-29', 'CR85', 'Income', 12345, 0, ARRAY['https://fixture.public.blob.vercel-storage.com/a.png','https://fixture.public.blob.vercel-storage.com/b.pdf'], NOW()), ('legacy-fleet', '2024-03-01', 'ALLCR', 'Other', 0, 333, ARRAY[]::text[], NOW()), ('legacy-null', '2024-03-02', NULL, 'Income', 222, 0, ARRAY[]::text[], NOW())`;
      await tx.$executeRaw`INSERT INTO "VehicleNote" (id, date, "vehicleId", note) VALUES ('legacy-note', '2024-03-01', 'ALLCR', 'Retained legacy note')`;
      const before = await tx.$queryRaw`SELECT id, date, "vehicleId", "incomeZarCents", "expenseZarCents", "photoUrls", "createdAt", "updatedAt" FROM "Transaction" ORDER BY id`;
      for (const name of migrations.slice(2)) await apply(name);
      const after = await tx.$queryRaw`SELECT id, date, "vehicleId", "incomeZarCents", "expenseZarCents", "photoUrls", "createdAt", "updatedAt" FROM "Transaction" ORDER BY id`;
      expect(after).toEqual(before);
      expect(await tx.$queryRaw`SELECT active, "purchasePriceCents", "deletedAt" FROM "Vehicle"`).toEqual([{ active: false, purchasePriceCents: 1234567, deletedAt: null }]);
      expect(await tx.$queryRaw`SELECT note FROM "VehicleNote"`).toEqual([{ note: 'Retained legacy note' }]);
    }, { timeout: 30000 });
    // Retain this synthetic namespace for inspection; no destructive cleanup.
  });
});
