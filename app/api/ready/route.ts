import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const expected = process.env.MONITORING_SECRET;
  const supplied = request.headers.get('authorization') || '';
  const wanted = `Bearer ${expected || ''}`;
  if (!expected || expected.length < 32 || Buffer.byteLength(supplied) !== Buffer.byteLength(wanted) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))) return NextResponse.json({ status: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    await prisma.$queryRaw`SELECT "id" FROM "Vehicle" LIMIT 0`;
    await prisma.$queryRaw`SELECT "id" FROM "StaffAccount" LIMIT 0`;
    await prisma.$queryRaw`SELECT "id" FROM "ChangeRequest" LIMIT 0`;
    await prisma.$queryRaw`SELECT "tokenHash", "principalType" FROM "PasswordReset" LIMIT 0`;
    await prisma.$queryRaw`SELECT "id", "targetMileageKm" FROM "WorkOrder" LIMIT 0`;
    await prisma.$queryRaw`SELECT "id" FROM "FleetDocument" LIMIT 0`;
    await prisma.$queryRaw`SELECT "id" FROM "AdministratorCredential" LIMIT 0`;
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { console.error('Database readiness check failed.'); return NextResponse.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
