export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { requireSession, handleApiError } from "@/lib/api-response";
import { z } from "zod";
import { businessToday, monthlySelection } from "@/lib/date-ranges";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = z.coerce.number().int().min(2000).max(2100).parse(yearParam ?? businessToday().getUTCFullYear());
    const { selection } = monthlySelection({ ...Object.fromEntries(searchParams), year: String(year) });
    const rows = await getMonthlyBreakdown(year, selection.range, selection.vehicleId);
    return NextResponse.json({ rows });
  } catch (error) {
    return handleApiError(error);
  }
}
