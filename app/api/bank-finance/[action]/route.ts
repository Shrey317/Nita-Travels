import { NextResponse } from 'next/server';
import { handleApiError, requireAdmin } from '@/lib/api-response';
import * as bank from '@/lib/db/bank-finance';
import { revalidatePath } from 'next/cache';
const actions: Record<string, (input: unknown, actor: string) => Promise<unknown>> = {
  agreements: bank.createBankAgreement, payments: bank.recordBankPayment, statements: bank.recordBankStatement,
  adjustments: bank.recordBankAdjustment, status: bank.changeBankStatus, reversal: bank.reverseBankPayment,
};
export async function POST(request: Request, props: { params: Promise<{ action: string }> }) {
  try {
    const session = await requireAdmin();
    const action = actions[(await props.params).action];
    if (!action) return NextResponse.json({ error: 'Unknown operation.' }, { status: 404 });
    const result = await action(await request.json(), session.staffId ?? 'admin');
    revalidatePath('/bank-finance', 'layout');
    return NextResponse.json({ result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
