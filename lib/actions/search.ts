"use server";

import { prisma } from "@/lib/db/client";
import { auth } from "@/auth";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "vehicle" | "transaction" | "repair" | "mileage";
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

  if (!query || query.length < 2) {
    return { vehicles: [], transactions: [], repairs: [], notes: [] };
  }

  const [vehicles, transactions, notes] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        OR: [
          { make: { contains: query, mode: "insensitive" } },
          { model: { contains: query, mode: "insensitive" } },
          { registration: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { notes: { contains: query, mode: "insensitive" } },
          { vehicleId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.vehicleNote.findMany({
      where: {
        OR: [
          { note: { contains: query, mode: "insensitive" } },
          { vehicleId: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  return {
    vehicles: vehicles.map((v) => ({
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
      type: "transaction", // Reusing transaction visual style for notes
    })),
  };
}
