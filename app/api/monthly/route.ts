export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const rows = await getMonthlyBreakdown(year);
    return NextResponse.json({ rows });
  } catch (error) {
    return handleApiError(error);
  }
}
