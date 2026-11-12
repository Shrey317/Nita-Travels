import { requireAdmin, handleApiError } from '@/lib/api-response';
import { getBankAgreement } from '@/lib/db/bank-finance';
import { csvRows } from '@/lib/reports';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireAdmin(); const row = await getBankAgreement(new URL(request.url).searchParams.get('id') ?? '');
    const csv = csvRows([['Vehicle','Bank','Date','Reference','Paid (R)','Principal (R)','Interest (R)','Fees (R)','Reversed'], ...row.payments.map(p => [row.vehicleId,row.bank,p.date.toISOString().slice(0,10),p.reference,p.amount.toFixed(2),p.principal?.toFixed(2) ?? 'Unknown',p.interest?.toFixed(2) ?? 'Unknown',p.fees?.toFixed(2) ?? 'Unknown',p.reversedAt ? 'Yes' : 'No'])]);
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="private-bank-ledger.csv"', 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
