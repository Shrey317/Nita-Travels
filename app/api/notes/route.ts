export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getNotes, createNote } from "@/lib/db/notes";
import { requireSession, handleApiError } from "@/lib/api-response";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { parseListQuery } from "@/lib/query-filters";
import { invalidateFleetData } from "@/lib/invalidate-fleet";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const result = await getNotes({
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
    const note = await createNote(body);
    invalidateFleetData();
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
