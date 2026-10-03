export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getMileageEntries, createMileageEntry } from "@/lib/db/mileage";
import { requireSession, handleApiError } from "@/lib/api-response";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { parseListQuery } from "@/lib/query-filters";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const result = await getMileageEntries({
      ...parseListQuery(sp),
      limit: DEFAULT_PAGE_SIZE,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const entry = await createMileageEntry(body);
    invalidateFleetData();
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
