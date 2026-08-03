export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const rows = await getMonthlyBreakdown();
    return NextResponse.json({ rows });
  } catch (error) {
    return handleApiError(error);
  }
}
