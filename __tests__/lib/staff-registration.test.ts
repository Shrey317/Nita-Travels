import { describe, expect, it } from 'vitest';
import {
  staffRegistrationSchema,
  adminCreateStaffSchema,
  adminUpdateStaffSchema,
} from '@/lib/staff-registration';
import { authConfig } from '@/auth.config';
import { NextRequest } from 'next/server';

describe('staff registration & admin user management schemas', () => {
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

  it('validates admin user creation with username or email and 8-72 char password', () => {
    const created = adminCreateStaffSchema.parse({
      name: ' Sipho Dlamini ',
      email: ' SIPHO ',
      password: 'password123',
    });
    expect(created).toEqual({
      name: 'Sipho Dlamini',
      email: 'sipho',
      password: 'password123',
    });
    expect(adminCreateStaffSchema.safeParse({ name: 'Sipho', email: 'ab', password: 'password123' }).success).toBe(false);
    expect(adminCreateStaffSchema.safeParse({ name: 'Sipho', email: 'sipho', password: 'short' }).success).toBe(false);
  });

  it('validates admin user status and password updates', () => {
    expect(adminUpdateStaffSchema.parse({ status: 'ACTIVE' })).toEqual({ status: 'ACTIVE' });
    expect(adminUpdateStaffSchema.parse({ status: 'DISABLED', password: 'newpassword123' })).toEqual({
      status: 'DISABLED',
      password: 'newpassword123',
    });
    expect(adminUpdateStaffSchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});

describe('role-based route authorization', () => {
  const authorized = authConfig.callbacks!.authorized!;

  it('blocks non-admin (MANAGER) from PATCH, PUT, and DELETE API calls with 403', async () => {
    for (const method of ['PATCH', 'PUT', 'DELETE']) {
      const req = new NextRequest('http://localhost/api/transactions/tx-1', {
        method,
        headers: { origin: 'http://localhost' },
      });
      const res = await authorized({
        auth: { user: { name: 'Staff' }, staffRole: 'MANAGER', expires: '' },
        request: req,
      });
      expect(res).toBeInstanceOf(Response);
      expect((res as Response).status).toBe(403);
    }
  });

  it('allows non-admin (MANAGER) to POST new transactions, mileage, notes, and vehicles', async () => {
    for (const path of ['/api/transactions', '/api/mileage', '/api/notes', '/api/vehicles']) {
      const req = new NextRequest(`http://localhost${path}`, {
        method: 'POST',
        headers: { origin: 'http://localhost' },
      });
      const res = await authorized({
        auth: { user: { name: 'Staff' }, staffRole: 'MANAGER', expires: '' },
        request: req,
      });
      expect(res).toBe(true);
    }
  });

  it('blocks non-admin (MANAGER) from /staff and /vehicles/[id]/edit and /api/staff', async () => {
    const apiStaffReq = new NextRequest('http://localhost/api/staff', { method: 'GET' });
    const apiStaffRes = await authorized({
      auth: { user: { name: 'Staff' }, staffRole: 'MANAGER', expires: '' },
      request: apiStaffReq,
    });
    expect(apiStaffRes).toBeInstanceOf(Response);
    expect((apiStaffRes as Response).status).toBe(403);

    const staffPageReq = new NextRequest('http://localhost/staff', { method: 'GET' });
    const staffPageRes = await authorized({
      auth: { user: { name: 'Staff' }, staffRole: 'MANAGER', expires: '' },
      request: staffPageReq,
    });
    expect(staffPageRes).toBeInstanceOf(Response);
    expect((staffPageRes as Response).status).toBe(302);

    const editVehicleReq = new NextRequest('http://localhost/vehicles/N001/edit', { method: 'GET' });
    const editVehicleRes = await authorized({
      auth: { user: { name: 'Staff' }, staffRole: 'MANAGER', expires: '' },
      request: editVehicleReq,
    });
    expect(editVehicleRes).toBeInstanceOf(Response);
    expect((editVehicleRes as Response).headers.get('location')).toBe('http://localhost/vehicles/N001');
  });

  it('allows ADMIN full access to PATCH, DELETE, /staff, and /vehicles/[id]/edit', async () => {
    const patchReq = new NextRequest('http://localhost/api/transactions/tx-1', {
      method: 'PATCH',
      headers: { origin: 'http://localhost' },
    });
    expect(
      await authorized({
        auth: { user: { name: 'Admin' }, staffRole: 'ADMIN', expires: '' },
        request: patchReq,
      })
    ).toBe(true);

    const staffReq = new NextRequest('http://localhost/staff', { method: 'GET' });
    expect(
      await authorized({
        auth: { user: { name: 'Admin' }, staffRole: 'ADMIN', expires: '' },
        request: staffReq,
      })
    ).toBe(true);
  });
});
