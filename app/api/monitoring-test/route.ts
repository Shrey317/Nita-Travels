import { NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/api-response';
import { captureException, flush } from '@sentry/nextjs';
import { checkLoginRateLimit } from '@/lib/rate-limit';
export async function POST() {
  try {
    await requireAdmin();
    if (!process.env.SENTRY_DSN) return NextResponse.json({ error: 'Error monitoring is not configured.' }, { status: 503 });
    if (!(await checkLoginRateLimit('monitoring-test')).allowed) return NextResponse.json({ error: 'Too many test events.' }, { status: 429 });
    const eventId = captureException(new Error('Controlled Nita Travels monitoring test'));
    const sent = await flush(5000);
    return NextResponse.json({ eventId, message: sent ? 'Test event dispatched. Confirm it in Sentry and check the alert inbox.' : 'Test event queued. Confirm delivery in Sentry.' });
  } catch (error) { return handleApiError(error); }
}
