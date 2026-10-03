export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAnalyticsReport, analyticsCompatibility } from "@/lib/db/analytics";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    await requireSession();
    const report = await getAnalyticsReport(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json({ ...report, ...analyticsCompatibility(report) });
  } catch (error) { return handleApiError(error); }
}
