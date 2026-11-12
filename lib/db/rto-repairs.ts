import { prisma, TRANSACTION_OPTIONS } from './client';
import { lockAgreement, operational } from './rto';
import { audit } from './fleet-assignment';
import { ConflictError, ValidationError } from '../errors';
import { money, repairSplit } from '../rto';
import { chargeSchema, repairApprovalSchema, repairInvoiceSchema, repairPaidSchema, repairQuotationSchema } from '../schemas/rto.schema';
export async function createRepairQuotation(input: unknown, actor: string) {
  const data = repairQuotationSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.date < agreement.startDate || data.date > new Date()) throw new ValidationError('Quotation date must be within the agreement and not future dated.');
    const row = await tx.rtoRepair.create({ data: { ...data, quotedDate: data.date, status: 'QUOTED', approvedAmount: 0, invoiceAmount: 0, recoveryAmount: 0, companyAmount: 0, driverAmount: 0 } });
    await audit(tx, 'RTO', agreement.id, 'REPAIR_QUOTED', actor, { repairId: row.id, quotation: data.quotation }); return row;
  }, TRANSACTION_OPTIONS);
}
export async function approveRepair(input: unknown, actor: string) {
  const data = repairApprovalSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const repair = await tx.rtoRepair.findFirstOrThrow({ where: { id: data.repairId, agreementId: agreement.id } });
    if (!['QUOTED','APPROVED'].includes(repair.status)) throw new ConflictError('Only a quoted or approved repair can receive a revised approval.');
    const row = await tx.rtoRepair.update({ where: { id: repair.id }, data: { status: 'APPROVED', approvedAmount: data.approvedAmount, approvedBy: actor } });
    await audit(tx, 'RTO', agreement.id, 'REPAIR_BUDGET_APPROVED', actor, { repairId: repair.id, previousApprovedAmount: repair.approvedAmount.toFixed(2), amount: data.approvedAmount, reason: data.reason }); return row;
  }, TRANSACTION_OPTIONS);
}
export async function invoiceRepair(input: unknown, actor: string) {
  const data = repairInvoiceSchema.parse(input); const split = repairSplit(data.invoiceAmount, data.recoveryAmount);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const repair = await tx.rtoRepair.findFirstOrThrow({ where: { id: data.repairId, agreementId: agreement.id } });
    if (repair.status !== 'APPROVED') throw new ConflictError('Approve the repair before recording its final invoice.');
    if (money(data.invoiceAmount).gt(repair.approvedAmount)) throw new ValidationError('Invoice exceeds the approved repair budget.');
    if (data.date < (repair.quotedDate ?? agreement.startDate) || data.date > new Date()) throw new ValidationError('Invoice date must follow quotation and cannot be in the future.');
    const row = await tx.rtoRepair.update({ where: { id: repair.id }, data: { status: 'INVOICED', date: data.date, invoiceAmount: data.invoiceAmount, recoveryAmount: data.recoveryAmount, companyAmount: split.company, driverAmount: split.driver } });
    if (split.driver.gt(0)) await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: data.date, kind: 'REPAIR', description: repair.description, amount: split.driver, sourceKey: `repair:${repair.id}` } });
    await audit(tx, 'RTO', agreement.id, 'REPAIR_INVOICED', actor, { repairId: repair.id, invoiceAmount: data.invoiceAmount, recoveries: data.recoveryAmount, driverContribution: split.driver.toFixed(2) }); return row;
  }, TRANSACTION_OPTIONS);
}
export async function markRepairPaid(input: unknown, actor: string) {
  const data = repairPaidSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId);
    const repair = await tx.rtoRepair.findFirstOrThrow({ where: { id: data.repairId, agreementId: agreement.id } });
    if (repair.status !== 'INVOICED') throw new ConflictError('Only an unpaid final invoice can be marked company-paid.');
    if (data.date < repair.date || data.date > new Date()) throw new ValidationError('Payment date must follow the invoice and cannot be in the future.');
    const row = await tx.rtoRepair.update({ where: { id: repair.id }, data: { status: 'PAID', companyPaidDate: data.date } });
    await audit(tx, 'RTO', agreement.id, 'COMPANY_REPAIR_PAID', actor, { repairId: repair.id, amount: repair.companyAmount.toFixed(2), reference: data.reference, date: data.date.toISOString() }); return row;
  }, TRANSACTION_OPTIONS);
}
export async function createDriverCharge(input: unknown, actor: string) {
  const data = chargeSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.date < agreement.startDate || data.date > new Date()) throw new ValidationError('Charge date must be inside the agreement and cannot be future dated.');
    const row = await tx.rtoCharge.create({ data: { agreementId: agreement.id, date: data.date, kind: data.kind, amount: data.amount, description: data.description, sourceKey: `manual:${agreement.id}:${data.reference}` } });
    await audit(tx, 'RTO', agreement.id, 'DRIVER_CHARGE_APPROVED', actor, { chargeId: row.id, ...data, date: data.date.toISOString() }); return row;
  }, TRANSACTION_OPTIONS);
}
