import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: { vehicleId: "CR07", mileageKm: { not: null } },
    orderBy: { date: "desc" }
  });

  console.log("All transactions with mileage for CR07:", JSON.stringify(transactions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
