import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    vehicle: { findUnique: vi.fn(), updateMany: vi.fn() },
    transaction: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    vehicleNote: { create: vi.fn() },
  };
  return { tx, prisma: { ...tx, $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) } };
});
vi.mock("@/lib/db/client", () => ({ prisma: mocks.prisma, TRANSACTION_OPTIONS: {} }));

import { createTransaction, updateTransaction } from "@/lib/db/transactions";
import { createNote } from "@/lib/db/notes";

const transactionInput = { date: new Date("2026-01-01"), vehicleId: "CR01", category: "Income" as const, incomeZarCents: 1_001, expenseZarCents: 0, photoUrls: [] };

describe("application-enforced vehicle relationships", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects a missing real vehicle before inserting a transaction", async () => {
    mocks.tx.vehicle.findUnique.mockResolvedValue(null);
    await expect(createTransaction(transactionInput)).rejects.toThrow("existing vehicle");
    expect(mocks.tx.transaction.create).not.toHaveBeenCalled();
  });
  it("checks deletedAt when validating references and retains inactive vehicle accounting", async () => {
    mocks.tx.vehicle.findUnique.mockResolvedValue({ id: "CR01" });
    mocks.tx.transaction.create.mockResolvedValue({ id: "tx", ...transactionInput });
    await expect(createTransaction(transactionInput)).resolves.toMatchObject({ id: "tx" });
    expect(mocks.tx.vehicle.findUnique).toHaveBeenCalledWith({ where: { id: "CR01", deletedAt: null }, select: { id: true } });
  });
  it.each([null, "ALLCR"])("preserves valid sentinel reference %s without a FK lookup", async (vehicleId) => {
    await createTransaction({ ...transactionInput, vehicleId });
    expect(mocks.tx.vehicle.findUnique).not.toHaveBeenCalled();
    expect(mocks.tx.transaction.create).toHaveBeenCalledOnce();
  });
  it("rejects changing an existing transaction to a nonexistent vehicle", async () => {
    mocks.tx.transaction.findUnique.mockResolvedValue({ id: "tx", ...transactionInput });
    mocks.tx.vehicle.findUnique.mockResolvedValue(null);
    await expect(updateTransaction("tx", { vehicleId: "CR99" })).rejects.toThrow("existing vehicle");
    expect(mocks.tx.transaction.update).not.toHaveBeenCalled();
  });
  it("rejects orphan notes but allows fleet-wide notes", async () => {
    mocks.tx.vehicle.findUnique.mockResolvedValue(null);
    const note = { date: new Date("2026-01-01"), vehicleId: "CR99", note: "Check tyres", photoUrls: [] };
    await expect(createNote(note)).rejects.toThrow("existing vehicle");
    expect(mocks.tx.vehicleNote.create).not.toHaveBeenCalled();
    await createNote({ ...note, vehicleId: "ALLCR" });
    expect(mocks.tx.vehicleNote.create).toHaveBeenCalledOnce();
  });
  it("uses a conditional atomic odometer bump so a stale read cannot lower mileage", async () => {
    mocks.tx.vehicle.findUnique.mockResolvedValue({ id: "CR01" });
    await createTransaction({ ...transactionInput, category: "Service", incomeZarCents: 0, mileageKm: 100_000 });
    expect(mocks.tx.vehicle.updateMany).toHaveBeenCalledWith({ where: { id: "CR01", deletedAt: null, currentMileageKm: { lt: 100_000 } }, data: { currentMileageKm: 100_000 } });
  });
});
