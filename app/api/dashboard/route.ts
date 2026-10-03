export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAnalyticsReport, analyticsCompatibility } from "@/lib/db/analytics";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    await requireSession();
    const [report, serviceOverview] = await Promise.all([getAnalyticsReport(Object.fromEntries(new URL(request.url).searchParams)), getServiceStatusAllVehicles()]);
    return NextResponse.json({ kpis: { ...report.current.totals, fleetSize: report.vehicles.filter(vehicle => vehicle.active).length }, vehicleSummary: analyticsCompatibility(report).vehicleSummary, serviceOverview, selection: report.selection });
  } catch (error) { return handleApiError(error); }
}
