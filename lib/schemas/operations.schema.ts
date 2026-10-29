import { z } from 'zod';
import { calendarDateSchema, attachmentUrlsSchema } from './common.schema';
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
}).superRefine((value, ctx) => {
  if (value.completedDate && (!value.startedDate || value.completedDate < value.startedDate))
    ctx.addIssue({ code: 'custom', path: ['completedDate'], message: 'Completion must be on or after the actual start date.' });
});
