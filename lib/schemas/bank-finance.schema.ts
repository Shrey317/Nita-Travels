import { z } from 'zod';
import { calendarDateSchema } from './common.schema';
import { amount, id, positiveAmount, text } from './rto.schema';
export const bankAgreementSchema = z.object({ vehicleId: id, bank: text, reference: id, startDate: calendarDateSchema, originalPrincipal: positiveAmount, termMonths: z.number().int().min(1).max(360), monthlyAmount: positiveAmount, interestRate: z.string().regex(/^\d{1,2}(\.\d{1,4})?$/).optional(), maturityDate: calendarDateSchema, firstDueDate: calendarDateSchema.optional(), paymentFrequency: z.enum(['WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY']).default('MONTHLY') });
export const bankPaymentSchema = z.object({ financeId: id, date: calendarDateSchema, amount: positiveAmount, principal: amount.optional(), interest: amount.optional(), fees: amount.optional(), reference: id, notes: text.optional(), idempotencyKey: z.string().uuid() });
export const bankStatementSchema = z.object({ financeId: id, date: calendarDateSchema, outstandingPrincipal: amount, arrears: amount.default('0'), fees: amount.default('0'), settlementAmount: amount.optional(), quotationDate: calendarDateSchema.optional(), quotationExpiry: calendarDateSchema.optional() });
export const bankAdjustmentSchema = z.object({ financeId: id, date: calendarDateSchema, amount: z.string().regex(/^-?\d{1,10}(\.\d{1,2})?$/), reason: text });
export const bankStatusSchema = z.object({ financeId: id, status: z.enum(['SETTLED', 'REFINANCED']), reason: text });
