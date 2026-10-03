"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";
import { ALL_CATEGORIES, CATEGORY_LABELS, REPAIR_CATEGORIES } from "@/lib/constants";
import { dateKey, parseCalendarDate } from "@/lib/date-ranges";
import { formatKm, formatZAR } from "@/lib/format";

export type SearchResultItem = {
  id: string; title: string; subtitle: string; href: string;
  type: "vehicle" | "transaction" | "repair" | "service" | "mileage" | "note";
};
export type SearchResults = {
  vehicles: SearchResultItem[]; transactions: SearchResultItem[]; repairs: SearchResultItem[];
  services: SearchResultItem[]; mileage: SearchResultItem[]; notes: SearchResultItem[];
};
const emptyResults = (): SearchResults => ({ vehicles: [], transactions: [], repairs: [], services: [], mileage: [], notes: [] });

/** Authenticated, bounded record search. Search fields never become raw SQL. */
export async function globalSearch(query: string): Promise<SearchResults> {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in to search fleet records.");
  if (typeof query !== "string") return emptyResults();
  const q = query.trim();
  if (q.length < 2) return emptyResults();
  if (q.length > 100) throw new Error("Search must be 100 characters or fewer.");
  const text = { contains: q, mode: "insensitive" as const };
  let date: Date | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
    try { date = parseCalendarDate(q); } catch { /* An invalid date can still match free text. */ }
  }
  const vehicles = await prisma.vehicle.findMany({
    where: { deletedAt: null, OR: [{ id: text }, { make: text }, { model: text }, { registration: text }, { registration2: text }, { insurer: text }, { policyNumber: text }, { warranty: text }, ...(date ? [{ insuranceEndDate: date }] : [])] },
    select: { id: true, make: true, model: true, registration: true, registration2: true, active: true, insurer: true, policyNumber: true, warranty: true },
    orderBy: { id: "asc" }, take: 20,
  });
  const vehicleIds = vehicles.map(vehicle => vehicle.id);
  const normalized = q.toLowerCase().replace(/\s/g, "");
  const categoryMatches = ALL_CATEGORIES.filter(category => `${category} ${CATEGORY_LABELS[category] ?? ""}`.toLowerCase().replace(/\s/g, "").includes(normalized));
  const recordMatches: Prisma.TransactionWhereInput = { deletedAt: null, OR: [
    { notes: text }, { vehicleId: text }, { vehicleId: { in: vehicleIds } },
    ...(date ? [{ date }] : []), ...(categoryMatches.length ? [{ category: { in: [...categoryMatches] } }] : []),
  ] };
  const transactionSelect = { id: true, date: true, vehicleId: true, category: true, notes: true, incomeZarCents: true, expenseZarCents: true } as const;
  const numericKm = /^\d{2,9}$/.test(q) ? Number(q) : undefined;
  const [transactions, repairs, services, mileage, notes] = await Promise.all([
    prisma.transaction.findMany({ where: { AND: [recordMatches, { category: { notIn: [...REPAIR_CATEGORIES, "Service"] } }] }, select: transactionSelect, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5 }),
    prisma.transaction.findMany({ where: { AND: [recordMatches, { category: { in: [...REPAIR_CATEGORIES] } }] }, select: transactionSelect, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5 }),
    prisma.transaction.findMany({ where: { AND: [recordMatches, { category: "Service" }] }, select: transactionSelect, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5 }),
    prisma.mileageEntry.findMany({ where: { vehicle: { deletedAt: null }, OR: [{ vehicleId: text }, { vehicleId: { in: vehicleIds } }, ...(date ? [{ date }] : []), ...(numericKm !== undefined ? [{ currentMileageKm: numericKm }, { previousMileageKm: numericKm }] : [])] },
      select: { id: true, vehicleId: true, date: true, currentMileageKm: true, distanceDrivenKm: true }, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5 }),
    prisma.vehicleNote.findMany({ where: { OR: [{ note: text }, { vehicleId: text }, { vehicleId: { in: vehicleIds } }, ...(date ? [{ date }] : [])] },
      select: { id: true, vehicleId: true, date: true, note: true }, orderBy: [{ date: "desc" }, { id: "desc" }], take: 5 }),
  ]);
  const mappedTransaction = (row: typeof transactions[number], type: "transaction" | "repair" | "service"): SearchResultItem => ({
    id: row.id, title: `${CATEGORY_LABELS[row.category] ?? row.category} · ${row.notes?.slice(0, 100) || row.vehicleId || "Fleet record"}`,
    subtitle: `${dateKey(row.date)} · ${row.vehicleId ?? "Unassigned"} · ${formatZAR(row.incomeZarCents || row.expenseZarCents)}`,
    href: `/transactions?txId=${encodeURIComponent(row.id)}`, type,
  });
  const exact = (vehicle: typeof vehicles[number]) => [vehicle.id, vehicle.registration, vehicle.registration2].some(value => value?.toLowerCase() === q.toLowerCase());
  return {
    vehicles: [...vehicles].sort((a, b) => Number(exact(b)) - Number(exact(a))).slice(0, 8).map(vehicle => ({
      id: vehicle.id, title: `${vehicle.id} · ${vehicle.make} ${vehicle.model} (${vehicle.registration})`,
      subtitle: [vehicle.active ? "Active" : "Inactive", vehicle.insurer, vehicle.policyNumber, vehicle.warranty].filter(Boolean).join(" · ").slice(0, 160), href: `/vehicles/${encodeURIComponent(vehicle.id)}`, type: "vehicle",
    })),
    transactions: transactions.map(row => mappedTransaction(row, "transaction")),
    repairs: repairs.map(row => mappedTransaction(row, "repair")),
    services: services.map(row => mappedTransaction(row, "service")),
    mileage: mileage.map(row => ({ id: row.id, title: `${row.vehicleId} · ${formatKm(row.currentMileageKm)}`, subtitle: `${dateKey(row.date)} · ${formatKm(row.distanceDrivenKm)} recorded distance`,
      href: `/mileage?vehicleId=${encodeURIComponent(row.vehicleId)}&dateFrom=${dateKey(row.date)}&dateTo=${dateKey(row.date)}#mileage-${row.id}`, type: "mileage" })),
    notes: notes.map(row => ({ id: row.id, title: `Note · ${row.vehicleId ?? "Unassigned"}`, subtitle: `${dateKey(row.date)} · ${row.note.slice(0, 120)}`,
      href: `/notes?noteId=${encodeURIComponent(row.id)}#note-${row.id}`, type: "note" })),
  };
}
