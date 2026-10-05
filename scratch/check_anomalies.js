const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, mileageAtPurchaseKm: true } });
  let found = 0;
  for (const v of vehicles) {
    const entries = await prisma.mileageEntry.findMany({ where: { vehicleId: v.id }, orderBy: [{ date: 'asc' }, { createdAt: 'asc' }] });
    let prev = v.mileageAtPurchaseKm;
    for (const e of entries) {
      if (e.currentMileageKm <= prev) {
        console.log(`Anomaly in ${v.id} on ${e.date}: ${e.currentMileageKm} <= ${prev}. ID: ${e.id}`);
        found++;
      }
      prev = e.currentMileageKm;
    }
  }
  console.log('Total anomalies:', found);
}
check();
