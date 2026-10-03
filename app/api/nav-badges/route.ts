import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-response";
import { getFleetNotifications } from "@/lib/db/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const notifications = await getFleetNotifications();
    const countVehicles = (category: string) => new Set(notifications.filter(item => item.category === category && item.priority !== "info").map(item => item.vehicleId)).size;
    return NextResponse.json({ serviceCount: countVehicles("service"), mileageCount: countVehicles("mileage"), insuranceCount: countVehicles("insurance") });
  } catch (error) {
    return handleApiError(error);
  }
}
