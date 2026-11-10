import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleApiError } from '@/lib/api-response';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit';
import { prepareAdministratorRecovery, verifyAdministratorRecovery } from '@/lib/administrator-recovery';
export async function POST(request: NextRequest) {
  try {
    const limit = await checkLoginRateLimit(`admin-recovery:${getClientIp(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
    const body = await request.json();
    if (body.action === 'setup') {
      await requireAdmin();
      await prepareAdministratorRecovery();
      return NextResponse.json({ message: 'Check the administrator recovery inbox for verification, or sign in again if already verified.' });
    }
    const input = z.object({ action: z.literal('verify'), token: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(body);
    try { await verifyAdministratorRecovery(input.token); }
    catch { return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 }); }
    return NextResponse.json({ message: 'Administrator recovery verified. Sign in again. Your password has not changed.' });
  } catch (error) { return handleApiError(error); }
}
