export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exportTransactionsToCsv } from "@/lib/db/transactions";
import { requireSession, handleApiError } from "@/lib/api-response";
import { parseListQuery } from "@/lib/query-filters";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const csv = await exportTransactionsToCsv(parseListQuery(sp));

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
