import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { audit, lockVehicle } from './fleet-assignment';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import { DEFAULT_TERMS, DAY, assertTransition, dueDates, installmentBalance, mileageCharge, money, repairSplit, sumMoney } from '../rto';
import * as s from '../schemas/rto.schema';

export async function lockAgreement(tx: Prisma.TransactionClient, id: string) {
  const found = await tx.rtoAgreement.findUnique({ where: { id } });
  if (!found) throw new NotFoundError('Agreement not found.');
  await lockVehicle(tx, found.vehicleId);
  await tx.$queryRaw`SELECT id FROM "RtoAgreement" WHERE id = ${id} FOR UPDATE`;
  return tx.rtoAgreement.findUniqueOrThrow({ where: { id } });
}
export function operational(status: string) {
  if (!['ACTIVE', 'SUSPENDED', 'IN_DEFAULT'].includes(status)) throw new ValidationError('An active, suspended or default agreement is required.');
}
export async function createDriver(input: unknown, actor: string) {
  const data = s.driverSchema.parse(input);
  return prisma.$transaction(async tx => {
    const row = await tx.rtoDriver.create({ data });
    await audit(tx, 'RTO', row.id, 'DRIVER_CREATED', actor, { name: row.name });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function createAgreement(input: unknown, actor: string) {
  const data = s.agreementSchema.parse(input);
  return prisma.$transaction(async tx => {
    const vehicle = await lockVehicle(tx, data.vehicleId);
    if (!vehicle.active) throw new ValidationError('Vehicle must be active.');
    const row = await tx.rtoAgreement.create({ data: { ...data, terms: DEFAULT_TERMS } });
    await audit(tx, 'RTO', row.id, 'DRAFT_CREATED', actor, { number: row.number });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function changeAgreementStatus(input: unknown, actor: string) {
  const data = s.statusSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId);
    assertTransition(agreement.status, data.status);
    if (['TERMINATED', 'COMPLETED'].includes(data.status) && await tx.rtoDowntime.count({ where: { agreementId: agreement.id, endsAt: null } })) throw new ValidationError('Close open downtime before resolving this agreement.');
    if (data.status === 'ACTIVE' && agreement.status === 'DRAFT') {
      const assignment = await tx.vehicleAssignment.findFirst({ where: { vehicleId: agreement.vehicleId, endsAt: null, module: 'RENT_TO_OWN' } });
      const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: agreement.vehicleId } });
      if (!vehicle.active || vehicle.availability !== 'AVAILABLE') throw new ValidationError('Vehicle must be physically available before activation.');
      if (!assignment || assignment.startsAt > agreement.startDate) throw new ValidationError('Transfer this vehicle to RTO on or before the agreement start date.');
      if (await tx.rtoAgreement.count({ where: { vehicleId: agreement.vehicleId, status: { in: ['ACTIVE', 'SUSPENDED', 'IN_DEFAULT'] } } })) throw new ConflictError('Vehicle already has an active agreement.');
      if (!await tx.rtoDocument.count({ where: { agreementId: agreement.id, kind: 'SIGNED_CONTRACT' } })) throw new ValidationError('Attach the signed contract before activation.');
      const upfront = await tx.rtoPayment.aggregate({ where: { agreementId: agreement.id, kind: 'UPFRONT', reversedAt: null }, _sum: { amount: true } });
      if (money(upfront._sum.amount ?? 0).lt(agreement.upfrontRequired)) throw new ValidationError('Record the required upfront payment before activation.');
      await tx.rtoInstallment.createMany({ data: dueDates(agreement.startDate, agreement.weeks, []).map((date, i) => ({ agreementId: agreement.id, sequence: i + 1, originalDueDate: date, effectiveDueDate: date, amount: agreement.weeklyAmount })) });
    }
    if (data.status === 'COMPLETED') {
      const installments = await tx.rtoInstallment.findMany({ where: { agreementId: agreement.id }, include: { allocations: { include: { payment: true } } } });
      const charges = await tx.rtoCharge.findMany({ where: { agreementId: agreement.id }, include: { allocations: { include: { payment: true } } } });
      const downtime = await tx.rtoDowntime.findMany({ where: { agreementId: agreement.id } });
      const completion = dueDates(agreement.startDate, agreement.weeks, downtime).at(-1)!;
      if (installments.length !== agreement.weeks || installments.some(i => installmentBalance(i.amount, i.allocations).gt(0)) || charges.some(c => installmentBalance(c.amount, c.allocations).gt(0)) || downtime.some(d => !d.endsAt) || completion > new Date()) throw new ValidationError('Completion requires all chargeable weeks elapsed, all obligations paid and downtime closed.');
    }
    const resolved = ['COMPLETED', 'TERMINATED', 'CANCELLED'].includes(data.status);
    const result = await tx.rtoAgreement.update({ where: { id: agreement.id }, data: { status: data.status, ...(agreement.status === 'DRAFT' && data.status === 'ACTIVE' ? { activatedAt: new Date() } : {}), ...(resolved ? { resolvedAt: new Date(), resolution: data.reason } : {}) } });
    await audit(tx, 'RTO', agreement.id, 'STATUS_CHANGED', actor, { from: agreement.status, to: data.status, reason: data.reason });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function recordRtoPayment(input: unknown, actor: string) {
  const data = s.paymentSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId);
    const existing = await tx.rtoPayment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) {
      if (existing.agreementId !== data.agreementId || !existing.amount.eq(data.amount) || existing.reference !== data.reference || existing.kind !== data.kind || +existing.date !== +data.date || existing.method !== data.method) throw new ConflictError('Idempotency key was already used for a different payment.');
      return existing;
    }
    if (data.date > new Date()) throw new ValidationError('Actual payments cannot be future dated.');
    if (data.kind !== 'UPFRONT') operational(agreement.status);
    else if (!['DRAFT', 'ACTIVE', 'SUSPENDED', 'IN_DEFAULT'].includes(agreement.status)) throw new ValidationError('Agreement is resolved.');
    const row = await tx.rtoPayment.create({ data: { ...data, actor } });
    let remaining = money(data.amount);
    if (data.kind === 'RENT') {
      const installments = await tx.rtoInstallment.findMany({ where: { agreementId: agreement.id }, orderBy: { sequence: 'asc' }, include: { allocations: { include: { payment: true } } } });
      for (const installment of installments) {
        const allocated = Prisma.Decimal.min(remaining, installmentBalance(installment.amount, installment.allocations));
        if (allocated.gt(0)) await tx.rtoPaymentAllocation.create({ data: { paymentId: row.id, installmentId: installment.id, amount: allocated } });
        remaining = remaining.minus(allocated);
        if (remaining.lte(0)) break;
      }
    } else if (data.kind === 'CHARGE') {
      const charges = await tx.rtoCharge.findMany({ where: { agreementId: agreement.id }, orderBy: [{ date: 'asc' }, { id: 'asc' }], include: { allocations: { include: { payment: true } } } });
      for (const charge of charges) {
        const allocated = Prisma.Decimal.min(remaining, installmentBalance(charge.amount, charge.allocations));
        if (allocated.gt(0)) await tx.rtoPaymentAllocation.create({ data: { paymentId: row.id, chargeId: charge.id, amount: allocated } });
        remaining = remaining.minus(allocated);
        if (remaining.lte(0)) break;
      }
    }
    await audit(tx, 'RTO', agreement.id, 'PAYMENT_RECORDED', actor, { paymentId: row.id, amount: data.amount, kind: data.kind, unallocated: remaining.toFixed(2) });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function reverseRtoPayment(input: unknown, actor: string) {
  const data = s.reversalSchema.parse(input);
  return prisma.$transaction(async tx => {
    const found = await tx.rtoPayment.findUniqueOrThrow({ where: { id: data.paymentId } });
    const agreement = await lockAgreement(tx, found.agreementId);
    const payment = await tx.rtoPayment.findUniqueOrThrow({ where: { id: data.paymentId } });
    if (agreement.status === 'COMPLETED') throw new ValidationError('A completed agreement requires a separate reviewed correction.');
    if (payment.reversedAt) throw new ConflictError('Payment was already reversed.');
    const result = await tx.rtoPayment.update({ where: { id: payment.id }, data: { reversedAt: new Date(), reversalReason: data.reason } });
    await audit(tx, 'RTO', agreement.id, 'PAYMENT_REVERSED', actor, data);
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function recordRtoMileage(input: unknown, actor: string) {
  const data = s.mileageSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: agreement.vehicleId } });
    const meter = await tx.vehicleOdometerEvent.findFirst({ where: { vehicleId: vehicle.id, effectiveDate: { lte: data.date } }, orderBy: { effectiveDate: 'desc' } });
    const displayedKm = data.readingType === 'DISPLAYED' ? data.odometerKm : null;
    if (data.readingType === 'DISPLAYED') data.odometerKm += meter?.offsetKm ?? 0;
    if (data.date < agreement.startDate || data.date > new Date() || data.odometerKm < vehicle.currentMileageKm) throw new ValidationError('Reading must be within the agreement, not future dated, and cannot decrease lifetime mileage.');
    const previous = await tx.rtoMileageEntry.findFirst({ where: { agreementId: agreement.id }, orderBy: { date: 'desc' } });
    // An initial reading is a baseline, never an invented chargeable distance.
    const distance = previous ? data.odometerKm - previous.odometerKm : 0;
    if (previous && data.date <= previous.date) throw new ValidationError('New readings must follow the most recent reading. Use the correction workflow for errors.');
    const baseline = await tx.rtoMileageEntry.findFirst({ where: { agreementId: agreement.id }, orderBy: { date: 'asc' } });
    const sevenDays = previous && baseline && (+data.date - +previous.date) / DAY === 7 && (+previous.date - +baseline.date) % (7 * DAY) === 0;
    const reviewRequired = !!previous && !sevenDays;
    const billed = sevenDays ? mileageCharge(distance, 7) : { excessKm: 0, amount: money(0) };
    if (sevenDays && distance > 5000) throw new ValidationError('A weekly increase above 5,000 km requires reconciliation.');
    const row = await tx.rtoMileageEntry.create({ data: { agreementId: data.agreementId, date: data.date, odometerKm: data.odometerKm, source: data.source, displayedKm, reviewRequired, distanceKm: distance, excessKm: billed.excessKm } });
    if (sevenDays) await tx.rtoMileagePeriod.create({ data: { agreementId: agreement.id, startsAt: previous!.date, endsAt: data.date, distanceKm: distance, excessKm: billed.excessKm, evidence: data.source, actor } });
    if (billed.amount.gt(0)) await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: data.date, kind: 'MILEAGE', description: `${billed.excessKm} excess km`, amount: billed.amount, sourceKey: `mileage:${row.id}` } });
    await tx.vehicle.update({ where: { id: vehicle.id }, data: { currentMileageKm: data.odometerKm } });
    await audit(tx, 'RTO', agreement.id, 'MILEAGE_RECORDED', actor, { entryId: row.id });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function recordManualRtoRepair(input: unknown, actor: string) {
  const data = s.repairSchema.omit({ quotation: true, approvedAmount: true }).parse(input);
  // The administrator submits the actual invoice directly; no quotation is invented.
  return recordRtoRepair({ ...data, quotation: '0', approvedAmount: data.invoiceAmount }, actor);
}
export async function recordRtoRepair(input: unknown, actor: string) {
  const data = s.repairSchema.parse(input);
  const split = repairSplit(data.invoiceAmount, data.recoveryAmount);
  if (money(data.invoiceAmount).gt(data.approvedAmount)) throw new ValidationError('Invoice exceeds the approved amount.');
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.date < agreement.startDate || data.date > new Date()) throw new ValidationError('Repair date must fall within the agreement and cannot be in the future.');
    const row = await tx.rtoRepair.create({ data: { ...data, companyAmount: split.company, driverAmount: split.driver, approvedBy: actor } });
    if (split.driver.gt(0)) await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: data.date, kind: 'REPAIR', description: data.description, amount: split.driver, sourceKey: `repair:${row.id}` } });
    await audit(tx, 'RTO', agreement.id, 'REPAIR_APPROVED', actor, { repairId: row.id, driverAmount: split.driver.toFixed(2) });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function recordRtoService(input: unknown, actor: string) {
  const data = s.serviceSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.date < agreement.startDate || data.date > new Date()) throw new ValidationError('Service date must fall within the agreement and cannot be in the future.');
    const row = await tx.rtoService.create({ data });
    await tx.vehicle.updateMany({ where: { id: agreement.vehicleId, currentMileageKm: { lt: data.odometerKm } }, data: { currentMileageKm: data.odometerKm } });
    await audit(tx, 'RTO', agreement.id, 'SERVICE_RECORDED', actor, { serviceId: row.id, companyPaid: true });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function refreshSchedule(tx: Prisma.TransactionClient, agreementId: string) {
  const agreement = await tx.rtoAgreement.findUniqueOrThrow({ where: { id: agreementId }, include: { downtime: true, installments: { orderBy: { sequence: 'asc' } } } });
  const dates = dueDates(agreement.startDate, agreement.weeks, agreement.downtime);
  for (const installment of agreement.installments) await tx.rtoInstallment.update({ where: { id: installment.id }, data: { effectiveDueDate: dates[installment.sequence - 1]! } });
}
export async function recordDowntime(input: unknown, actor: string) {
  const data = s.downtimeSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.startsAt < agreement.startDate || data.startsAt > new Date() || (data.endsAt && (data.endsAt <= data.startsAt || data.endsAt > new Date()))) throw new ValidationError('Provide valid downtime within the agreement, ending after it starts.');
    const overlap = await tx.rtoDowntime.count({ where: { agreementId: agreement.id, ...(data.endsAt ? { startsAt: { lt: data.endsAt } } : {}), OR: [{ endsAt: null }, { endsAt: { gt: data.startsAt } }] } });
    if (overlap) throw new ConflictError('Downtime overlaps an existing suspension.');
    if (data.replacementVehicleId) {
      if (data.replacementVehicleId === agreement.vehicleId) throw new ValidationError('Replacement must be a different vehicle.');
      const replacement = await lockVehicle(tx, data.replacementVehicleId);
      const assignment = await tx.vehicleAssignment.findFirst({ where: { vehicleId: replacement.id, endsAt: null } });
      if (!replacement.active || replacement.availability !== 'AVAILABLE' || assignment?.module !== 'UNASSIGNED' || assignment.startsAt > data.startsAt) throw new ValidationError('Replacement must be available and unassigned for the requested interval.');
      if (await tx.rtoDowntime.count({ where: { replacementVehicleId: replacement.id, ...(data.endsAt ? { startsAt: { lt: data.endsAt } } : {}), OR: [{ endsAt: null }, { endsAt: { gt: data.startsAt } }] } })) throw new ConflictError('Replacement is already reserved during this interval.');
    }
    const row = await tx.rtoDowntime.create({ data: { ...data, approvedBy: actor, replacementReturnedAt: data.endsAt ?? null } });
    if (!data.endsAt) await tx.vehicle.update({ where: { id: agreement.vehicleId }, data: { availability: 'UNAVAILABLE' } });
    await refreshSchedule(tx, agreement.id);
    await audit(tx, 'RTO', agreement.id, 'DOWNTIME_APPROVED', actor, { downtimeId: row.id });
    return row;
  }, TRANSACTION_OPTIONS);
}
export async function closeDowntime(input: unknown, actor: string) {
  const data = s.downtimeCloseSchema.parse(input);
  return prisma.$transaction(async tx => {
    const found = await tx.rtoDowntime.findUniqueOrThrow({ where: { id: data.downtimeId } });
    const agreement = await lockAgreement(tx, found.agreementId);
    const row = await tx.rtoDowntime.findUniqueOrThrow({ where: { id: data.downtimeId } });
    if (row.endsAt || data.endsAt <= row.startsAt || data.endsAt > new Date()) throw new ValidationError('Downtime must be open with a valid end time.');
    if (row.replacementVehicleId) await lockVehicle(tx, row.replacementVehicleId);
    const result = await tx.rtoDowntime.update({ where: { id: row.id }, data: { endsAt: data.endsAt, replacementReturnedAt: data.endsAt } });
    await tx.vehicle.update({ where: { id: agreement.vehicleId }, data: { availability: 'AVAILABLE' } });
    await refreshSchedule(tx, row.agreementId);
    await audit(tx, 'RTO', row.agreementId, 'DOWNTIME_CLOSED', actor, { downtimeId: row.id, endsAt: data.endsAt.toISOString() });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function settlementReview(input: unknown, actor: string) {
  const data = s.settlementSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const installments = await tx.rtoInstallment.findMany({ where: { agreementId: agreement.id }, include: { allocations: { include: { payment: true } } } });
    if (data.approvedAmount !== undefined && !data.legalBasis) throw new ValidationError('Approval requires the reviewed contractual/statutory basis.');
    const downtime = await tx.rtoDowntime.findMany({ where: { agreementId: agreement.id } });
    const completedWeeks = dueDates(agreement.startDate, agreement.weeks, downtime).filter(d => d <= new Date()).length;
    const indicativeAmount = agreement.weeklyAmount.times(agreement.weeks - completedWeeks);
    const result = await tx.rtoSettlementReview.create({ data: { ...data, indicativeAmount, status: data.approvedAmount === undefined ? 'PENDING' : 'APPROVED', reviewedBy: data.approvedAmount === undefined ? null : actor } });
    await audit(tx, 'RTO', agreement.id, 'SETTLEMENT_REVIEW', actor, { reviewId: result.id, status: result.status, unpaidScheduledBalance: sumMoney(installments.map(i => installmentBalance(i.amount, i.allocations))).toFixed(2) });
    return result;
  }, TRANSACTION_OPTIONS);
}

export async function getRtoAgreement(id: string) {
  const agreement = await prisma.rtoAgreement.findUnique({ where: { id }, include: {
    vehicle: { select: { id: true, registration: true, make: true, model: true, currentMileageKm: true, availability: true, odometerEvents: { orderBy: { effectiveDate: 'desc' } } } }, driver: true,
    installments: { orderBy: { sequence: 'asc' }, include: { allocations: { include: { payment: true } } } },
    payments: { orderBy: [{ date: 'desc' }, { id: 'asc' }], include: { allocations: true } },
    charges: { include: { allocations: { include: { payment: true } } } },
    mileage: { orderBy: { date: 'desc' } }, repairs: { orderBy: { date: 'desc' } }, services: { orderBy: { date: 'desc' } }, downtime: { orderBy: { startsAt: 'asc' } },
    documents: { select: { id: true, title: true, kind: true, createdAt: true } }, settlements: true, mileagePeriods: { orderBy: { startsAt: 'desc' } },
  } });
  if (!agreement) throw new NotFoundError('Agreement not found.');
  const dates = dueDates(agreement.startDate, agreement.weeks, agreement.downtime);
  const installments = agreement.installments.map((i, index) => ({ ...i, effectiveDueDate: dates[index]!, balance: installmentBalance(i.amount, i.allocations).toFixed(2) }));
  const completedWeeks = agreement.activatedAt ? dates.filter(date => date <= new Date()).length : 0;
  const auditHistory = await prisma.fleetAuditEvent.findMany({ where: { scope: 'RTO', recordId: id }, orderBy: { createdAt: 'desc' }, take: 200 });
  return { ...agreement, installments, completedWeeks, remainingWeeks: agreement.weeks - completedWeeks, completionDate: dates.at(-1), progress: Math.floor(completedWeeks / agreement.weeks * 100), auditHistory,
    indicativeSettlement: agreement.weeklyAmount.times(agreement.weeks - completedWeeks).toFixed(2),
    scheduledBalance: sumMoney(installments.map(i => i.balance)).toFixed(2),
    amountReceived: sumMoney(agreement.payments.filter(p => !p.reversedAt).map(p => p.amount)).toFixed(2),
    upfrontReceived: sumMoney(agreement.payments.filter(p => !p.reversedAt && p.kind === 'UPFRONT').map(p => p.amount)).toFixed(2),
    downtimeDays: agreement.downtime.reduce((n, d) => n + (+(d.endsAt ?? new Date()) - +d.startsAt) / DAY, 0),
    chargeBalance: sumMoney(agreement.charges.map(c => installmentBalance(c.amount, c.allocations))).toFixed(2),
    unallocatedRent: sumMoney(agreement.payments.filter(p => !p.reversedAt && p.kind === 'RENT').map(p => p.amount.minus(sumMoney(p.allocations.map(a => a.amount))))).toFixed(2),
  };
}

export async function adjustInstallment(input: unknown, actor: string) {
  const data = s.installmentAdjustmentSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const installment = await tx.rtoInstallment.findFirstOrThrow({ where: { id: data.installmentId, agreementId: agreement.id }, include: { allocations: { include: { payment: true } } } });
    const allocated = installment.amount.minus(installmentBalance(installment.amount, installment.allocations));
    if (money(data.revisedAmount).lt(allocated)) throw new ValidationError('Reverse or reconcile allocated payments before reducing this obligation below its allocated amount.');
    const result = await tx.rtoInstallment.update({ where: { id: installment.id }, data: { amount: data.revisedAmount } });
    await audit(tx, 'RTO', agreement.id, 'INSTALLMENT_ADJUSTED', actor, { installmentId: installment.id, previousAmount: installment.amount.toFixed(2), revisedAmount: data.revisedAmount, reason: data.reason });
    return result;
  }, TRANSACTION_OPTIONS);
}

export async function correctRtoMileage(input: unknown, actor: string) {
  const data = s.mileageCorrectionSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const entries = await tx.rtoMileageEntry.findMany({ where: { agreementId: agreement.id }, orderBy: { date: 'desc' }, take: 2 });
    const entry = entries[0]; const previous = entries[1];
    if (!entry || entry.id !== data.entryId) throw new ValidationError('Only the latest reading can be corrected. Earlier readings require a reconciled historical correction.');
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: agreement.vehicleId } });
    const [handover, service, rentalMileage, rentalService, meter] = await Promise.all([
      tx.vehicleTransfer.aggregate({ where: { vehicleId: agreement.vehicleId }, _max: { odometerKm: true } }),
      tx.rtoService.aggregate({ where: { status: 'COMPLETED', agreement: { vehicleId: agreement.vehicleId } }, _max: { odometerKm: true } }),
      tx.mileageEntry.aggregate({ where: { vehicleId: agreement.vehicleId }, _max: { currentMileageKm: true } }),
      tx.transaction.aggregate({ where: { vehicleId: agreement.vehicleId, deletedAt: null }, _max: { mileageKm: true } }),
      tx.vehicleOdometerEvent.aggregate({ where: { vehicleId: agreement.vehicleId }, _max: { lifetimeKm: true } }),
    ]);
    const floor = Math.max(previous?.odometerKm ?? 0, vehicle.mileageAtPurchaseKm, handover._max.odometerKm ?? 0, service._max.odometerKm ?? 0, rentalMileage._max.currentMileageKm ?? 0, rentalService._max.mileageKm ?? 0, meter._max.lifetimeKm ?? 0);
    if (data.odometerKm < floor) throw new ValidationError('Correction conflicts with an earlier odometer, handover or service reading.');
    const distance = previous ? data.odometerKm - previous.odometerKm : 0;
    const period = previous ? await tx.rtoMileagePeriod.findFirst({ where: { agreementId: agreement.id, endsAt: entry.date } }) : null;
    if (period && await tx.rtoCharge.count({ where: { sourceKey: `mileage-period:${period.id}` } })) throw new ValidationError('This reading supports reviewed weekly allocations. Reconcile those allocations before correcting it.');
    if (period && previous && +period.startsAt !== +previous.date) throw new ValidationError('This reading supports reviewed weekly allocations. Reconcile those allocations before correcting it.');
    const billed = period ? mileageCharge(distance, 7) : { excessKm: 0, amount: money(0) };
    const activeMeter = entry.displayedKm === null ? null : await tx.vehicleOdometerEvent.findFirst({ where: { vehicleId: vehicle.id, effectiveDate: { lte: entry.date } }, orderBy: { effectiveDate: 'desc' } });
    const displayedKm = entry.displayedKm === null ? null : data.odometerKm - (activeMeter?.offsetKm ?? 0);
    if (displayedKm !== null && displayedKm < 0) throw new ValidationError('Correction would put the displayed odometer below zero.');
    const charge = await tx.rtoCharge.findUnique({ where: { sourceKey: `mileage:${entry.id}` }, include: { allocations: { include: { payment: true } } } });
    const allocated = charge ? charge.amount.minus(installmentBalance(charge.amount, charge.allocations)) : money(0);
    if (billed.amount.lt(allocated)) throw new ValidationError('Reconcile or reverse the mileage charge payment before reducing the charge.');
    const result = await tx.rtoMileageEntry.update({ where: { id: entry.id }, data: { odometerKm: data.odometerKm, displayedKm, distanceKm: distance, excessKm: billed.excessKm } });
    if (previous) await tx.rtoMileagePeriod.updateMany({ where: { agreementId: agreement.id, startsAt: previous.date, endsAt: entry.date }, data: { distanceKm: distance, excessKm: billed.excessKm, evidence: `Corrected: ${data.reason}`, actor } });
    if (charge) await tx.rtoCharge.update({ where: { id: charge.id }, data: { amount: billed.amount, description: `${billed.excessKm} excess km (corrected)` } });
    else if (billed.amount.gt(0)) await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: entry.date, kind: 'MILEAGE', description: `${billed.excessKm} excess km`, amount: billed.amount, sourceKey: `mileage:${entry.id}` } });
    // Only replace the shared current reading if this was its source; preserve later/manual evidence.
    await tx.vehicle.update({ where: { id: vehicle.id }, data: { currentMileageKm: Math.max(data.odometerKm, vehicle.currentMileageKm === entry.odometerKm ? floor : vehicle.currentMileageKm) } });
    await audit(tx, 'RTO', agreement.id, 'MILEAGE_CORRECTED', actor, { entryId: entry.id, previousOdometerKm: entry.odometerKm, revisedOdometerKm: data.odometerKm, previousCharge: charge?.amount.toFixed(2) ?? '0.00', revisedCharge: billed.amount.toFixed(2), reason: data.reason });
    return result;
  }, TRANSACTION_OPTIONS);
}
