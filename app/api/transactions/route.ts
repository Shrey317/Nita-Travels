export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getTransactions, createTransaction } from "@/lib/db/transactions";
import { requireSession, handleApiError } from "@/lib/api-response";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const vehicleId = sp.getAll("vehicleId");
    const category = sp.getAll("category");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const search = sp.get("search") ?? undefined;
    const page = Number(sp.get("page") ?? "1");

    const result = await getTransactions({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      category: category.length ? category : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: DEFAULT_PAGE_SIZE,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const transaction = await createTransaction(body);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
