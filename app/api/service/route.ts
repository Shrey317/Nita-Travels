export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServiceStatusWithEstimates } from "@/lib/db/service";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const rows = await getServiceStatusWithEstimates();
    return NextResponse.json({ rows });
  } catch (error) {
    return handleApiError(error);
  }
}
