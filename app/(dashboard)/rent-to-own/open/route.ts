import { NextResponse } from 'next/server';
import { requireSession, handleApiError } from '@/lib/api-response';
export async function GET(request: Request) {
  try {
    await requireSession();
    const query = new URL(request.url).searchParams;
    const id = query.get('agreement') ?? '';
    const tab = query.get('tab') ?? 'overview';
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !['overview','entries','payments','mileage','repairs','service','downtime','documents','settlements'].includes(tab)) return NextResponse.json({error:'Choose a car first.'},{status:400});
    return new Response(null, { status: 303, headers: { Location: `/rent-to-own/agreements/${encodeURIComponent(id)}?tab=${tab}` } });
  } catch(error) { return handleApiError(error); }
}
