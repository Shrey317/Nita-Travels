import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-response";
import { getFleetNotifications } from "@/lib/db/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const notifications = await getFleetNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    return handleApiError(error);
  }
}
