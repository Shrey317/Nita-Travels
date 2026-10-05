export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPreviousMileage } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";
import { calendarDateSchema } from "@/lib/schemas/common.schema";

export async function GET(request: Request, props: { params: Promise<{ vehicleId: string }> }) {
  const params = await props.params;
  try {
    await requireSession();
    const date = new URL(request.url).searchParams.get("date");
    const previousMileageKm = await getPreviousMileage(params.vehicleId, date ? calendarDateSchema.parse(date) : undefined);
    return NextResponse.json({ previousMileageKm });
  } catch (error) {
    return handleApiError(error);
  }
}
