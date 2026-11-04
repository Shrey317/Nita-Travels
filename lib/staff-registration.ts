import { z } from 'zod';

export const ownerEmail = 'nishantsingh9686@gmail.com';

export const staffRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Enter the manager name.').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password: z.string()
    .min(12, 'Password must be at least 12 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .refine(password => Buffer.byteLength(password, 'utf8') <= 72, 'Password must be 72 bytes or fewer.'),
}).strict();

export const adminCreateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100),
  email: z.string().trim().toLowerCase().min(3, 'Enter an email address or username (at least 3 characters).').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .refine(password => Buffer.byteLength(password, 'utf8') <= 72, 'Password must be 72 bytes or fewer.'),
}).strict();

export const adminUpdateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the user name.').max(100).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISABLED']).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .refine(password => Buffer.byteLength(password, 'utf8') <= 72, 'Password must be 72 bytes or fewer.')
    .optional(),
}).strict();
