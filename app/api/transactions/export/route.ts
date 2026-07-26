import { NextRequest, NextResponse } from "next/server";
import { exportTransactionsToCsv } from "@/lib/db/transactions";
import { handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const vehicleId = sp.getAll("vehicleId");
    const category = sp.getAll("category");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const search = sp.get("search") ?? undefined;

    const csv = await exportTransactionsToCsv({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      category: category.length ? category : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      search,
    });

    const filename = `nita-travels-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
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
