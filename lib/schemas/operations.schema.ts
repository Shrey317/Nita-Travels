import { z } from 'zod';
import { calendarDateSchema, attachmentUrlsSchema } from './common.schema';
import { businessToday } from '@/lib/date-ranges';
export const documentSchema = z.object({
  vehicleId: z.string().min(1), title: z.string().trim().min(1).max(120),
  documentType: z.enum(['Insurance', 'Licence', 'Roadworthy', 'Registration', 'Other']),
  reference: z.string().trim().max(150).nullable().optional(), expiryDate: calendarDateSchema,
  photoUrls: attachmentUrlsSchema.default([]),
});
export const workOrderSchema = z.object({
  vehicleId: z.string().min(1), kind: z.enum(['SERVICE', 'REPAIR']),
  title: z.string().trim().min(1).max(120), plannedDate: calendarDateSchema,
  startedDate: calendarDateSchema.nullable().optional(), completedDate: calendarDateSchema.nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  workshop: z.string().trim().max(150).nullable().optional(),
  targetMileageKm: z.number().int().nonnegative().nullable().optional(),
  expenseTransactionId: z.string().max(100).nullable().optional(),
}).superRefine((value, ctx) => {
  const today = businessToday();
  if (value.startedDate && value.startedDate > today) ctx.addIssue({ code: 'custom', path: ['startedDate'], message: 'Actual start cannot be in the future. Use the planned date for scheduling.' });
  if (value.completedDate && value.completedDate > today) ctx.addIssue({ code: 'custom', path: ['completedDate'], message: 'Actual completion cannot be in the future.' });
  if (value.completedDate && (!value.startedDate || value.completedDate < value.startedDate))
    ctx.addIssue({ code: 'custom', path: ['completedDate'], message: 'Completion must be on or after the actual start date.' });
});
