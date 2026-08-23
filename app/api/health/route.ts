import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Safe health endpoint — reveals no internal details (SRS 99). */
export async function GET() {
  try {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
