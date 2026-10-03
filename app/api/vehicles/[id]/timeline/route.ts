export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVehicleTimeline } from "@/lib/db/vehicles";
import { requireSession, handleApiError } from "@/lib/api-response";
import { parseListQuery } from "@/lib/query-filters";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const type = sp.get("type");

    const result = await getVehicleTimeline(params.id, {
      ...parseListQuery(sp),
      type: type === "transactions" || type === "notes" ? type : "all",
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
