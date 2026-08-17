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
};

export async function globalSearch(query: string): Promise<SearchResults> {
  const session = await auth();
  if (!session) return { vehicles: [], transactions: [], repairs: [] };

  if (!query || query.length < 2) {
    return { vehicles: [], transactions: [], repairs: [] };
  }

  const [vehicles, transactions] = await Promise.all([
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
  ]);

  return {
    vehicles: vehicles.map((v: any) => ({
      id: v.id,
      title: `${v.make} ${v.model} (${v.registration})`,
      subtitle: `Status: ${v.active ? "Active" : "Inactive"}`,
      href: `/vehicles/${v.id}`,
      type: "vehicle",
    })),
    transactions: transactions.filter((t: any) => t.category !== "Repairs").map((t: any) => ({
      id: t.id,
      title: `${t.category} - ${t.notes || "No notes"}`,
      subtitle: `Date: ${t.date.toISOString().split("T")[0]}`,
      href: `/transactions/${t.id}`,
      type: "transaction",
    })),
    repairs: transactions.filter((t: any) => t.category === "Repairs").map((t: any) => ({
      id: t.id,
      title: `Repair - ${t.notes || "No notes"}`,
      subtitle: `Date: ${t.date.toISOString().split("T")[0]}`,
      href: `/repairs`, // Repairs don't have individual pages currently
      type: "repair",
    })),
  };
}
