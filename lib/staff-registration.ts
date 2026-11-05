import { z } from 'zod';

export const STAFF_PASSWORD_MIN_LENGTH = 12;
export const STAFF_PASSWORD_MAX_LENGTH = 72;
const staffPasswordSchema = z.string()
  .min(STAFF_PASSWORD_MIN_LENGTH, 'Use at least 12 characters.')
  .max(STAFF_PASSWORD_MAX_LENGTH, 'Use at most 72 characters.')
  .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.');

export const staffRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: staffPasswordSchema,
}).strict();

export const ownerEmail = 'nitatravels.sa@gmail.com';

export const adminCreateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100),
  email: z.string().trim().toLowerCase().min(3, 'Enter an email address or username (at least 3 characters).').max(254),
  password: staffPasswordSchema,
}).strict();

export const adminUpdateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
  password: staffPasswordSchema.optional(),
}).strict();
