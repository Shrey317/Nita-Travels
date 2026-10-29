import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireSession, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Safe health endpoint — reveals no internal details (SRS 99). */
export async function GET() {
  try {
    await requireSession();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    const response = handleApiError(error);
    if (response.status === 401) return response;
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
