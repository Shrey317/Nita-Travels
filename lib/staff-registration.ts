import { z } from 'zod';

export const staffRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12, 'Use at least 12 characters.').max(72, 'Use at most 72 characters.')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.'),
}).strict();

export const ownerEmail = 'nitatravels.sa@gmail.com';
