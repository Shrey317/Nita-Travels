import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { startOfWeek } from "date-fns";
import { getVehiclesWithFinancials } from "@/lib/db/vehicles";

export async function GET() {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  // Get current date range
  const today = new Date();
  
  const vehicles = await getVehiclesWithFinancials(new Date(0), today);
  
  let serviceOverdueCount = 0;
  let serviceDueCount = 0;
  let insuranceExpiredCount = 0;
  let insuranceExpiringCount = 0;
  
  for (const v of vehicles) {
    if (v.service?.status === "OVERDUE") serviceOverdueCount++;
    if (v.service?.status === "DUE_SOON") serviceDueCount++;
    
    if (v.vehicle.insuranceEndDate) {
      const end = new Date(v.vehicle.insuranceEndDate).getTime();
      if (end < today.getTime()) {
        insuranceExpiredCount++;
      } else if (end - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
        insuranceExpiringCount++;
      }
    }
  }

  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const [recentMileageEntries, mileageViolationsCount] = await Promise.all([
    prisma.mileageEntry.groupBy({
      by: ['vehicleId'],
      where: { date: { gte: startOfCurrentWeek } },
    }),
    prisma.mileageEntry.count({
      where: { date: { gte: startOfCurrentWeek }, overLimitByKm: { gt: 0 } }
    })
  ]);

  const vehiclesWithRecentMileage = new Set(recentMileageEntries.map(e => e.vehicleId));
  const missingMileageCount = vehicles.filter(v => !vehiclesWithRecentMileage.has(v.vehicle.id)).length;

  return NextResponse.json({
    serviceCount: serviceOverdueCount + serviceDueCount,
    mileageCount: missingMileageCount + mileageViolationsCount,
    insuranceCount: insuranceExpiredCount + insuranceExpiringCount,
  });
}
