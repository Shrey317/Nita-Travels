import type { Prisma } from '@prisma/client';

/** Legacy vehicles without assignments remain Normal Rental until explicitly transferred. */
export const normalRentalVehicles: Prisma.VehicleWhereInput = {
  assignments: { none: { endsAt: null, module: { not: 'NORMAL_RENTAL' } } },
};
/** Historical rental reports retain vehicles that previously worked in Normal Rental. */
export const rentalHistoryVehicles: Prisma.VehicleWhereInput = {
  OR: [{ assignments: { none: {} } }, { assignments: { some: { module: 'NORMAL_RENTAL' } } }],
};
