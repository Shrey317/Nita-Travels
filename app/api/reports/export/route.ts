export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-response";
import { getAnalyticsReport } from "@/lib/db/analytics";
import { getPeriodBreakdown } from "@/lib/db/periods";
import { dateKey } from "@/lib/date-ranges";
import { isReportType, reportCsv, csvRows } from "@/lib/reports";
import { ValidationError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const query = request.nextUrl.searchParams;
    const type = query.get("type") ?? "financial";
    if (!isReportType(type)) throw new ValidationError("Choose a supported report type.");
    const report = await getAnalyticsReport(Object.fromEntries(query));
    let csv: string;
    if (type === "weekly" || type === "monthly") {
      const periods = await getPeriodBreakdown(report.selection.range, type === "weekly" ? "week" : "month", report.selection.vehicleId);
      csv = csvRows([["Report", type], ["Selected from", dateKey(report.selection.range.from)], ["Selected to", dateKey(report.selection.range.to)], ["Currency", "ZAR integer cents"], ["Period start", "Period end", "Revenue cents", "Expense cents", "Profit cents", "Margin ratio", "Repairs cents", "Maintenance cents", "Mileage km"], ...periods.map(row => [dateKey(row.from), dateKey(row.to), row.incomeCents, row.expenseCents, row.netProfitCents, row.margin, row.repairsCents, row.maintenanceCents, row.mileageKm])]);
    } else csv = reportCsv(report, type);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="nita-${type}-${dateKey(report.selection.range.from)}.csv"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
