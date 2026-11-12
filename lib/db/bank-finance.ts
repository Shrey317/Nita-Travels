import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { audit, lockVehicle } from './fleet-assignment';
import { ConflictError, ValidationError } from '../errors';
import { money, sumMoney } from '../rto';
import * as s from '../schemas/bank-finance.schema';
import { reversalSchema } from '../schemas/rto.schema';
async function lockFinance(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "BankFinanceAgreement" WHERE id = ${id} FOR UPDATE`;
  return tx.bankFinanceAgreement.findUniqueOrThrow({ where: { id } });
}
export async function createBankAgreement(input: unknown, actor: string) {
  const data = s.bankAgreementSchema.parse(input);
  if (data.maturityDate <= data.startDate) throw new ValidationError('Maturity must follow commencement.');
  if (data.firstDueDate && (data.firstDueDate < data.startDate || data.firstDueDate > data.maturityDate)) throw new ValidationError('First instalment date must be within the finance term.');
  return prisma.$transaction(async tx => {
    await lockVehicle(tx, data.vehicleId);
    if (await tx.bankFinanceAgreement.count({ where: { vehicleId: data.vehicleId, status: 'ACTIVE' } })) throw new ConflictError('Resolve or refinance the existing bank agreement first.');
    const result = await tx.bankFinanceAgreement.create({ data });
    await audit(tx, 'BANK', result.id, 'AGREEMENT_CREATED', actor, { vehicleId: data.vehicleId });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function recordBankPayment(input: unknown, actor: string) {
  const data = s.bankPaymentSchema.parse(input);
  if (data.date > new Date()) throw new ValidationError('Actual bank payments cannot be future dated.');
  const components = [data.principal, data.interest, data.fees];
  const known = components.filter((v): v is string => v !== undefined);
  const total = sumMoney(known);
  if (total.gt(data.amount) || (known.length === 3 && !total.eq(data.amount))) throw new ValidationError('Payment components must reconcile with the actual payment.');
  return prisma.$transaction(async tx => {
    await lockFinance(tx, data.financeId);
    const existing = await tx.bankFinancePayment.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
    if (existing) {
      if (existing.financeId !== data.financeId || !existing.amount.eq(data.amount) || existing.reference !== data.reference || +existing.date !== +data.date || ['principal', 'interest', 'fees'].some(k => {
        const key = k as 'principal' | 'interest' | 'fees'; return existing[key]?.toFixed(2) !== (data[key] === undefined ? undefined : money(data[key]!).toFixed(2));
      })) throw new ConflictError('Idempotency key was used for a different payment.');
      return existing;
    }
    const result = await tx.bankFinancePayment.create({ data: { ...data, actor } });
    await audit(tx, 'BANK', data.financeId, 'PAYMENT_RECORDED', actor, { paymentId: result.id, amount: data.amount });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function recordBankStatement(input: unknown, actor: string) {
  const data = s.bankStatementSchema.parse(input);
  if (data.date > new Date()) throw new ValidationError('Statement cannot be future dated.');
  if (data.settlementAmount !== undefined && (!data.quotationDate || !data.quotationExpiry || data.quotationExpiry < data.quotationDate)) throw new ValidationError('Settlement quote requires valid quotation and expiry dates.');
  return prisma.$transaction(async tx => {
    await lockFinance(tx, data.financeId);
    const result = await tx.bankFinanceStatement.create({ data: { ...data, actor } });
    await audit(tx, 'BANK', data.financeId, 'STATEMENT_VERIFIED', actor, { statementId: result.id });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function recordBankAdjustment(input: unknown, actor: string) {
  const data = s.bankAdjustmentSchema.parse(input);
  return prisma.$transaction(async tx => {
    await lockFinance(tx, data.financeId);
    const result = await tx.bankFinanceAdjustment.create({ data: { ...data, actor } });
    await audit(tx, 'BANK', data.financeId, 'ADJUSTMENT_RECORDED', actor, { adjustmentId: result.id });
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function changeBankStatus(input: unknown, actor: string) {
  const data = s.bankStatusSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockFinance(tx, data.financeId);
    if (agreement.status !== 'ACTIVE') throw new ValidationError('Only active finance can be closed.');
    const latest = await tx.bankFinanceStatement.findFirst({ where: { financeId: data.financeId }, orderBy: { date: 'desc' } });
    if (data.status === 'SETTLED' && (!latest || !latest.outstandingPrincipal.isZero() || !latest.arrears.isZero() || !latest.fees.isZero())) throw new ValidationError('Settlement requires a verified zero principal, arrears and fee statement.');
    if (data.status === 'SETTLED' && latest) {
      const laterChanges = await tx.bankFinanceAdjustment.count({ where: { financeId: data.financeId, date: { gt: latest.date } } });
      if (laterChanges) throw new ValidationError('Reconcile later adjustments with a new verified zero-balance statement before marking finance settled.');
    }
    const result = await tx.bankFinanceAgreement.update({ where: { id: data.financeId }, data: { status: data.status } });
    await audit(tx, 'BANK', data.financeId, 'STATUS_CHANGED', actor, data);
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function reverseBankPayment(input: unknown, actor: string) {
  const data = reversalSchema.parse(input);
  return prisma.$transaction(async tx => {
    const found = await tx.bankFinancePayment.findUniqueOrThrow({ where: { id: data.paymentId } });
    await lockFinance(tx, found.financeId);
    const row = await tx.bankFinancePayment.findUniqueOrThrow({ where: { id: data.paymentId } });
    if (row.reversedAt) throw new ConflictError('Payment already reversed.');
    const result = await tx.bankFinancePayment.update({ where: { id: row.id }, data: { reversedAt: new Date(), reversalReason: data.reason } });
    await audit(tx, 'BANK', row.financeId, 'PAYMENT_REVERSED', actor, data);
    return result;
  }, TRANSACTION_OPTIONS);
}
export async function getBankAgreement(id: string) {
  const row = await prisma.bankFinanceAgreement.findUniqueOrThrow({ where: { id }, include: {
    vehicle: { select: { id: true, registration: true } }, payments: { orderBy: { date: 'desc' } }, statements: { orderBy: { date: 'desc' } }, adjustments: { orderBy: { date: 'desc' } }, documents: { select: { id: true, title: true, createdAt: true } },
  } });
  const currentPayments = row.payments.filter(p => !p.reversedAt);
  return { ...row, totalPaid: sumMoney(currentPayments.map(p => p.amount)).toFixed(2), knownPrincipalRepaid: sumMoney(currentPayments.filter(p => p.principal !== null).map(p => p.principal!)).toFixed(2), unknownPrincipalPayments: currentPayments.filter(p => p.principal === null).length,
    latestStatement: row.statements[0] ?? null,
    latestQuote: row.statements.find(s => s.settlementAmount !== null) ?? null,
    auditHistory: await prisma.fleetAuditEvent.findMany({ where: { scope: 'BANK', recordId: id }, orderBy: { createdAt: 'desc' }, take: 200 }),
  };
}
