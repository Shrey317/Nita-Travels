import { prisma, TRANSACTION_OPTIONS } from './client';
import { audit, lockVehicle } from './fleet-assignment';
import { lockAgreement, operational, refreshSchedule } from './rto';
import { ConflictError, ValidationError } from '../errors';
import { DAY, WEEK, mileageCharge, sumMoney } from '../rto';
import { availabilitySchema, downtimeCorrectionSchema, meterReplacementSchema, mileageReconciliationSchema } from '../schemas/rto.schema';

export async function recordMeterReplacement(input: unknown, actor: string) {
  const data = meterReplacementSchema.parse(input);
  return prisma.$transaction(async tx => {
    const vehicle = await lockVehicle(tx, data.vehicleId);
    const lastReading = await tx.rtoMileageEntry.findFirst({ where: { agreement: { vehicleId: vehicle.id } }, orderBy: { date: 'desc' } });
    const lastEvent = await tx.vehicleOdometerEvent.findFirst({ where: { vehicleId: vehicle.id }, orderBy: { effectiveDate: 'desc' } });
    const [rentalReading, lastTransfer] = await Promise.all([
      tx.mileageEntry.findFirst({ where: { vehicleId: vehicle.id }, orderBy: { date: 'desc' } }),
      tx.vehicleTransfer.findFirst({ where: { vehicleId: vehicle.id }, orderBy: { effectiveAt: 'desc' } }),
    ]);
    if ((rentalReading && data.effectiveDate < rentalReading.date) || (lastTransfer && data.effectiveDate < lastTransfer.effectiveAt)) throw new ValidationError('Meter replacement cannot precede an existing rental reading or handover.');
    if (data.effectiveDate > new Date() || (lastReading && data.effectiveDate < lastReading.date) || (lastEvent && data.effectiveDate <= lastEvent.effectiveDate)) throw new ValidationError('Meter replacement must follow prior readings/replacements and cannot be future dated.');
    if (data.lifetimeKm < vehicle.currentMileageKm || data.displayedKm > data.lifetimeKm) throw new ValidationError('Lifetime mileage cannot decrease and must be at least the new displayed reading.');
    const row = await tx.vehicleOdometerEvent.create({ data: { ...data, offsetKm: data.lifetimeKm - data.displayedKm, actor } });
    await tx.vehicle.update({ where: { id: vehicle.id }, data: { currentMileageKm: data.lifetimeKm } });
    await audit(tx, 'FLEET', vehicle.id, 'METER_REPLACED', actor, { eventId: row.id, lifetimeKm: row.lifetimeKm, displayedKm: row.displayedKm, offsetKm: row.offsetKm, reason: row.reason });
    return row;
  }, TRANSACTION_OPTIONS);
}

export async function setVehicleAvailability(input: unknown, actor: string) {
  const data = availabilitySchema.parse(input);
  return prisma.$transaction(async tx => {
    const vehicle = await lockVehicle(tx, data.vehicleId);
    const open = await tx.rtoDowntime.count({ where: { OR: [{ agreement: { vehicleId: vehicle.id }, endsAt: null }, { replacementVehicleId: vehicle.id, replacementReturnedAt: null }] } });
    if (open) throw new ConflictError('Resolve open downtime or the replacement reservation before changing availability.');
    if (data.availability === 'DISPOSED' && await tx.rtoAgreement.count({ where: { vehicleId: vehicle.id, status: { in: ['ACTIVE','SUSPENDED','IN_DEFAULT'] } } })) throw new ConflictError('Resolve the active driver agreement before disposal.');
    const result = await tx.vehicle.update({ where: { id: vehicle.id }, data: { availability: data.availability } });
    await audit(tx, 'FLEET', vehicle.id, 'AVAILABILITY_CHANGED', actor, { from: vehicle.availability, to: data.availability, reason: data.reason });
    return result;
  }, TRANSACTION_OPTIONS);
}

export async function reconcileMileage(input: unknown, actor: string) {
  const data = mileageReconciliationSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const start = await tx.rtoMileageEntry.findFirstOrThrow({ where: { id: data.startEntryId, agreementId: agreement.id } });
    const end = await tx.rtoMileageEntry.findFirstOrThrow({ where: { id: data.endEntryId, agreementId: agreement.id } });
    const baseline = await tx.rtoMileageEntry.findFirstOrThrow({ where: { agreementId: agreement.id }, orderBy: { date: 'asc' } });
    if ((+start.date - +baseline.date) % WEEK !== 0) throw new ValidationError('Reconciliation must begin on a seven-day boundary measured from the original baseline.');
    if (+end.date - +start.date !== data.weeklyDistances.length * WEEK) throw new ValidationError('The selected readings must cover exactly the submitted number of seven-day weeks. Add a boundary reading to close a partial week.');
    if (data.weeklyDistances.reduce((n, km) => n + km, 0) !== end.odometerKm - start.odometerKm) throw new ValidationError('Verified weekly distances must reconcile exactly to the lifetime odometer movement.');
    const intermediate = await tx.rtoMileageEntry.findMany({ where: { agreementId: agreement.id, date: { gt: start.date, lt: end.date } } });
    for (const reading of intermediate) {
      const elapsedWeeks = (+reading.date - +start.date) / WEEK;
      const completed = Math.floor(elapsedWeeks);
      const floor = data.weeklyDistances.slice(0, completed).reduce((n, km) => n + km, 0);
      const ceiling = elapsedWeeks === completed ? floor : floor + data.weeklyDistances[completed]!;
      const distance = reading.odometerKm - start.odometerKm;
      if (distance < floor || distance > ceiling) throw new ValidationError('Weekly allocation contradicts an intermediate odometer reading. Reconcile the evidence first.');
    }
    if (await tx.rtoMileagePeriod.count({ where: { agreementId: agreement.id, startsAt: { lt: end.date }, endsAt: { gt: start.date } } })) throw new ConflictError('This interval includes weeks already billed or reconciled. Choose an unbilled range.');
    const periods = [];
    for (let i = 0; i < data.weeklyDistances.length; i++) {
      const distance = data.weeklyDistances[i]!;
      const billed = mileageCharge(distance, 7);
      const startsAt = new Date(+start.date + i * WEEK); const endsAt = new Date(+startsAt + WEEK);
      const period = await tx.rtoMileagePeriod.create({ data: { agreementId: agreement.id, startsAt, endsAt, distanceKm: distance, excessKm: billed.excessKm, evidence: data.evidence, actor } });
      if (billed.amount.gt(0)) await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: endsAt, kind: 'MILEAGE', amount: billed.amount, description: `Reviewed week ${startsAt.toISOString().slice(0,10)}: ${billed.excessKm} excess km`, sourceKey: `mileage-period:${period.id}` } });
      periods.push(period);
    }
    await tx.rtoMileageEntry.updateMany({ where: { agreementId: agreement.id, date: { gt: start.date, lte: end.date } }, data: { reviewRequired: false } });
    await audit(tx, 'RTO', agreement.id, 'MILEAGE_RECONCILED', actor, { startEntryId: start.id, endEntryId: end.id, weeklyDistances: data.weeklyDistances, evidence: data.evidence, totalCharge: sumMoney(periods.map(p => mileageCharge(p.distanceKm,7).amount)).toFixed(2) });
    return periods;
  }, TRANSACTION_OPTIONS);
}

export async function correctDowntime(input: unknown, actor: string) {
  const data = downtimeCorrectionSchema.parse(input);
  return prisma.$transaction(async tx => {
    const found = await tx.rtoDowntime.findUniqueOrThrow({ where: { id: data.downtimeId } });
    const agreement = await lockAgreement(tx, found.agreementId); operational(agreement.status);
    const row = await tx.rtoDowntime.findUniqueOrThrow({ where: { id: found.id } });
    if (!row.endsAt || data.endsAt <= data.startsAt || data.startsAt < agreement.startDate || data.endsAt > new Date()) throw new ValidationError('Correct a closed downtime interval with valid dates inside the agreement.');
    if (await tx.rtoDowntime.count({ where: { agreementId: agreement.id, id: { not: row.id }, startsAt: { lt: data.endsAt }, OR: [{ endsAt: null }, { endsAt: { gt: data.startsAt } }] } })) throw new ConflictError('Corrected downtime overlaps another suspension.');
    if (row.replacementVehicleId) {
      await lockVehicle(tx, row.replacementVehicleId);
      if (await tx.rtoDowntime.count({ where: { replacementVehicleId: row.replacementVehicleId, id: { not: row.id }, startsAt: { lt: data.endsAt }, OR: [{ endsAt: null }, { endsAt: { gt: data.startsAt } }] } })) throw new ConflictError('Corrected dates overlap another reservation of the replacement vehicle.');
    }
    const result = await tx.rtoDowntime.update({ where: { id: row.id }, data: { startsAt: data.startsAt, endsAt: data.endsAt, replacementReturnedAt: data.endsAt } });
    await refreshSchedule(tx, agreement.id);
    await audit(tx, 'RTO', agreement.id, 'DOWNTIME_CORRECTED', actor, { downtimeId: row.id, before: { startsAt: row.startsAt.toISOString(), endsAt: row.endsAt.toISOString() }, after: { startsAt: data.startsAt.toISOString(), endsAt: data.endsAt.toISOString() }, reason: data.reason, extensionChangeDays: ((+data.endsAt - +data.startsAt) - (+row.endsAt - +row.startsAt)) / DAY });
    return result;
  }, TRANSACTION_OPTIONS);
}
