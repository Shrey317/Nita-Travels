import { z } from 'zod';

export const staffRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12, 'Use at least 12 characters.').max(72, 'Use at most 72 characters.')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.'),
}).strict();

export const ownerEmail = 'nitatravels.sa@gmail.com';

export const adminCreateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100),
  email: z.string().trim().toLowerCase().min(3, 'Enter an email address or username (at least 3 characters).').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.'),
}).strict();

export const adminUpdateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.')
    .optional(),
}).strict();
