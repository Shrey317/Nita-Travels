export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehicleTimeline } from "@/lib/db/vehicles";
import { requireSession, handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get("page") ?? "1");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const type = sp.get("type");

    const result = await getVehicleTimeline(params.id, {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      type: type === "transactions" || type === "notes" ? type : "all",
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
