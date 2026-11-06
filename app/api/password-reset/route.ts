import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit';
import { completePasswordReset, requestPasswordReset } from '@/lib/password-reset';
import { handleApiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const generic = { message: 'If an active manager account matches that email, a reset link will be sent.' };
  try {
    const limit = await checkLoginRateLimit(`password-reset:${getClientIp(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    const body = await request.json();
    if (body.action === 'request') {
      const { email } = z.object({ action: z.literal('request'), email: z.string().trim().toLowerCase().email().max(254) }).strict().parse(body);
      const accountLimit = await checkLoginRateLimit(`password-reset-email:${email}`);
      if (accountLimit.allowed) {
        try { await requestPasswordReset(email); } catch { console.error('Password recovery request failed.'); }
      }
      return NextResponse.json(generic, { headers: { 'Cache-Control': 'no-store' } });
    }
    const input = z.object({ action: z.literal('reset'), token: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().max(72) }).strict().parse(body);
    try { await completePasswordReset(input.token, input.password); }
    catch { return NextResponse.json({ error: 'This reset link is invalid or expired, or the password does not meet the 12–72 character requirements. Request a new link and try again.' }, { status: 400 }); }
    return NextResponse.json({ message: 'Password updated. Sign in with your new password.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}
