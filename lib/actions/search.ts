"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/auth";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "vehicle" | "transaction" | "repair" | "mileage" | "note";
};

export type SearchResults = {
  vehicles: SearchResultItem[];
  transactions: SearchResultItem[];
  repairs: SearchResultItem[];
  notes: SearchResultItem[];
};

export async function globalSearch(query: string): Promise<SearchResults> {
  const session = await auth();
  if (!session) return { vehicles: [], transactions: [], repairs: [], notes: [] };

  const q = query?.trim();
  if (!q || q.length < 2) {
    return { vehicles: [], transactions: [], repairs: [], notes: [] };
  }

  const exactMatches = await prisma.vehicle.findMany({
    where: {
      deletedAt: null,
      OR: [
        { id: { equals: q, mode: "insensitive" } },
        { registration: { equals: q, mode: "insensitive" } },
      ],
    },
    take: 3,
  });

  const exactIds = new Set(exactMatches.map(v => v.id));

  const [vehicles, transactions, notes] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        id: { notIn: Array.from(exactIds) },
        OR: [
          { make: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
          { registration: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: {
        deletedAt: null,
        OR: [
          { notes: { contains: q, mode: "insensitive" } },
          { vehicleId: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.vehicleNote.findMany({
      where: {
        OR: [
          { note: { contains: q, mode: "insensitive" } },
          { vehicleId: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  const allVehicles = [...exactMatches, ...vehicles];

  return {
    vehicles: allVehicles.map((v) => ({
      id: v.id,
      title: `${v.make} ${v.model} (${v.registration})`,
      subtitle: `Status: ${v.active ? "Active" : "Inactive"}`,
      href: `/vehicles/${v.id}`,
      type: "vehicle",
    })),
    transactions: transactions.filter((t) => t.category !== "Repairs").map((t) => ({
      id: t.id,
      title: `${t.category} - ${t.notes || "No notes"}`,
      subtitle: `Date: ${t.date.toISOString().split("T")[0]}`,
      href: `/transactions?txId=${t.id}`,
      type: "transaction",
    })),
    repairs: transactions.filter((t) => t.category === "Repairs").map((t) => ({
      id: t.id,
      title: `Repair - ${t.notes || "No notes"}`,
      subtitle: `Date: ${t.date.toISOString().split("T")[0]}`,
      href: `/transactions?txId=${t.id}`, // Route to transaction edit instead of read-only repairs log
      type: "repair",
    })),
    notes: notes.map((n) => ({
      id: n.id,
      title: n.vehicleId ? `Note for ${n.vehicleId}` : "Fleet-wide Note",
      subtitle: `Date: ${n.date.toISOString().split("T")[0]}`,
      href: n.vehicleId && n.vehicleId !== "ALLCR" ? `/vehicles/${n.vehicleId}?type=notes` : `/vehicles`,
      type: "note", 
    })),
  };
}
