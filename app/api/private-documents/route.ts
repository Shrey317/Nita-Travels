import { NextResponse } from 'next/server';
import { requireAdmin, requireSession, handleApiError } from '@/lib/api-response';
import { prisma, TRANSACTION_OPTIONS } from '@/lib/db/client';
import { audit } from '@/lib/db/fleet-assignment';
import { ValidationError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (Number(request.headers.get('content-length') ?? 0) > 3 * 1024 * 1024) throw new ValidationError('Document limit is 2 MB.');
    const form = await request.formData();
    const file = form.get('file');
    const scope = String(form.get('scope')); const recordId = String(form.get('recordId'));
    const kind = String(form.get('kind') || 'SUPPORTING');
    if (!['RTO', 'BANK'].includes(scope) || !recordId || !['SIGNED_CONTRACT', 'SUPPORTING', 'RECEIPT', 'ODOMETER'].includes(kind)) throw new ValidationError('Choose a valid document category.');
    if (!(file instanceof File) || file.size < 1 || file.size > 2 * 1024 * 1024) throw new ValidationError('Choose a PDF, JPEG or PNG no larger than 2 MB.');
    const content = Buffer.from(await file.arrayBuffer());
    const mimeType = content.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff ? 'image/jpeg' : content.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : null;
    if (!mimeType) throw new ValidationError('Unsupported document content.');
    const actor = session.staffId ?? 'admin';
    const result = await prisma.$transaction(async tx => {
      const data = { title: file.name.slice(0, 200), content, mimeType, actor };
      const row = scope === 'BANK'
        ? await tx.bankFinanceDocument.create({ data: { ...data, financeId: recordId }, select: { id: true } })
        : await tx.rtoDocument.create({ data: { ...data, agreementId: recordId, kind }, select: { id: true } });
      await audit(tx, scope, recordId, 'DOCUMENT_ATTACHED', actor, { documentId: row.id, kind });
      return row;
    }, TRANSACTION_OPTIONS);
    return NextResponse.json(result);
  } catch (error) { return handleApiError(error); }
}
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const scope = query.get('scope'); const id = query.get('id') ?? '';
    if (scope === 'BANK') await requireAdmin(); else if (scope === 'RTO') await requireSession(); else throw new ValidationError('Unknown document scope.');
    const row = scope === 'BANK' ? await prisma.bankFinanceDocument.findUniqueOrThrow({ where: { id } }) : await prisma.rtoDocument.findUniqueOrThrow({ where: { id } });
    return new Response(new Uint8Array(row.content), { headers: { 'Content-Type': row.mimeType, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.title)}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return handleApiError(error); }
}
