export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exportMileageToCsv } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const vehicleId = sp.getAll("vehicleId");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");

    const csv = await exportMileageToCsv({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    const filename = `nita-travels-mileage-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
