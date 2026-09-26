const fs = require('fs');

const seedFile = './scripts/seed_custom.ts';
let content = fs.readFileSync(seedFile, 'utf8');

const newCsv = fs.readFileSync('./scratch/temp_csv.txt', 'utf8');

// Replace the rawCsv block
const startMarker = 'const rawCsv = `';
const endMarker = '`;\n\nfunction parseAmount';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find rawCsv block in seed_custom.ts");
  process.exit(1);
}

const newBlock = startMarker + newCsv + endMarker;

let updatedContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex + endMarker.length);

// Also add sync_mileage logic at the end of the run() function, before returning.
// Find the end of the run() function
const syncLogic = `
  console.log("Synchronizing missing Mileage Log entries from transactions...");
  const { getISOWeek, getISOWeekYear } = require('date-fns');
  
  const txsWithMileage = await prisma.transaction.findMany({
    where: { mileageKm: { not: null } },
    orderBy: { date: 'asc' }
  });
  
  let added = 0;
  for (const tx of txsWithMileage) {
    const existing = await prisma.mileageEntry.findFirst({
      where: {
        vehicleId: tx.vehicleId,
        date: tx.date,
        currentMileageKm: tx.mileageKm
      }
    });
    
    if (!existing) {
      const latestEntry = await prisma.mileageEntry.findFirst({
        where: { vehicleId: tx.vehicleId, date: { lte: tx.date } },
        orderBy: { date: "desc" },
        select: { currentMileageKm: true },
      });
      const vehicle = await prisma.vehicle.findUnique({ 
        where: { id: tx.vehicleId }, 
        select: { mileageAtPurchaseKm: true } 
      });
      
      const prev = latestEntry?.currentMileageKm ?? vehicle?.mileageAtPurchaseKm ?? 0;
      const current = tx.mileageKm;
      
      const distanceDrivenKm = Math.max(0, current - prev);
      const isoWeek = getISOWeek(tx.date);
      const isoYear = getISOWeekYear(tx.date);
      const weeklyLimitKm = 2000;
      const overLimitByKm = distanceDrivenKm > weeklyLimitKm ? distanceDrivenKm - weeklyLimitKm : null;

      await prisma.mileageEntry.create({
        data: {
          date: tx.date,
          vehicleId: tx.vehicleId,
          previousMileageKm: prev,
          currentMileageKm: current,
          distanceDrivenKm,
          isoWeek,
          isoYear,
          weeklyLimitKm,
          overLimitByKm,
        }
      });
      added++;
    }
  }
  
  console.log(\`Created \${added} missing Mileage Log entries from transactions!\`);
  console.log('Seed completed successfully!');
`;

updatedContent = updatedContent.replace("console.log('Seed completed successfully!');", syncLogic);

fs.writeFileSync(seedFile, updatedContent);
console.log('Successfully updated seed_custom.ts');
