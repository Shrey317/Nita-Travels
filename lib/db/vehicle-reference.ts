import type { Prisma } from "@prisma/client";
import { FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import { ValidationError } from "@/lib/errors";

/** Transaction/Note references cannot use a FK because ALLCR is a valid fleet sentinel. */
export async function requireVehicleReference(db: Prisma.TransactionClient, vehicleId: string | null): Promise<void> {
  if (!vehicleId || vehicleId === FLEET_WIDE_VEHICLE_ID) return;
  const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId, deletedAt: null }, select: { id: true } });
  if (!vehicle) throw new ValidationError("Select an existing vehicle", "vehicleId");
}
