import { describe, expect, it } from 'vitest';
import { staffRegistrationSchema } from '@/lib/staff-registration';

describe('staff registration', () => {
  it('normalizes email identity and rejects submitted permissions', () => {
    const input = { name: ' Test Manager ', email: ' MANAGER@example.com ', password: 'a sufficiently long password' };
    expect(staffRegistrationSchema.parse(input)).toMatchObject({ name: 'Test Manager', email: 'manager@example.com' });
    expect(staffRegistrationSchema.safeParse({ ...input, role: 'ADMIN' }).success).toBe(false);
    expect(staffRegistrationSchema.safeParse({ ...input, status: 'ACTIVE' }).success).toBe(false);
  });
  it('rejects weak and bcrypt-truncated passwords', () => {
    const input = { name: 'Manager', email: 'manager@example.com' };
    expect(staffRegistrationSchema.safeParse({ ...input, password: 'short' }).success).toBe(false);
    expect(staffRegistrationSchema.safeParse({ ...input, password: 'é'.repeat(40) }).success).toBe(false);
  });
});
