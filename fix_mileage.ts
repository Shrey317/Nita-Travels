import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      mileageEntries: { orderBy: { date: "desc" }, take: 1 }
    }
  });

  const mismatches = [];

  for (const v of vehicles) {
    const transactions = await prisma.transaction.findMany({
      where: { vehicleId: v.id, category: "Service", mileageKm: { not: null } },
      orderBy: { date: "desc" },
      take: 1
    });

    const latestLog = v.mileageEntries[0]?.currentMileageKm || 0;
    const latestService = transactions[0]?.mileageKm || 0;
    const trueMax = Math.max(v.mileageAtPurchaseKm, latestLog, latestService);

    if (v.currentMileageKm !== trueMax) {
      mismatches.push({
        id: v.id,
        registration: v.registration,
        currentInDb: v.currentMileageKm,
        trueMax: trueMax,
        purchase: v.mileageAtPurchaseKm,
        latestLog,
        latestService
      });
    }
  }

  console.log("Mismatches found:", JSON.stringify(mismatches, null, 2));

  for (const m of mismatches) {
    await prisma.vehicle.update({
      where: { id: m.id },
      data: { currentMileageKm: m.trueMax }
    });
    console.log(`Fixed ${m.id}: ${m.currentInDb} -> ${m.trueMax}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
