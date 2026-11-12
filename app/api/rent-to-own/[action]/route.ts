import { createRtoVehicle } from '@/lib/db/rto-vehicles';
import { NextResponse } from 'next/server';
import { handleApiError, requireAdmin } from '@/lib/api-response';
import * as rto from '@/lib/db/rto';
import { correctDowntime, reconcileMileage, recordMeterReplacement, setVehicleAvailability } from '@/lib/db/rto-reconciliation';
import { approveRepair, createDriverCharge, createRepairQuotation, invoiceRepair, markRepairPaid } from '@/lib/db/rto-repairs';
import { completeRtoService, planRtoService } from '@/lib/db/rto-service';
import { transferVehicle } from '@/lib/db/fleet-assignment';
import { revalidatePath } from 'next/cache';
const actions: Record<string, (input: unknown, actor: string) => Promise<unknown>> = {
  vehicles: createRtoVehicle, drivers: rto.createDriver, agreements: rto.createAgreement, status: rto.changeAgreementStatus,
  payments: rto.recordRtoPayment, reversal: rto.reverseRtoPayment, mileage: rto.recordRtoMileage,
  repairs: rto.recordRtoRepair, 'manual-repair': rto.recordManualRtoRepair, services: rto.recordRtoService, downtime: rto.recordDowntime,
  'close-downtime': rto.closeDowntime, settlement: rto.settlementReview, transfer: transferVehicle,
  'adjust-installment': rto.adjustInstallment, 'correct-mileage': rto.correctRtoMileage,
  'reconcile-mileage': reconcileMileage, 'meter-replacement': recordMeterReplacement, availability: setVehicleAvailability, 'correct-downtime': correctDowntime,
  'repair-quotation': createRepairQuotation, 'repair-approval': approveRepair, 'repair-invoice': invoiceRepair, 'repair-paid': markRepairPaid, charges: createDriverCharge,
  'plan-service': planRtoService, 'complete-service': completeRtoService,
};
export async function POST(request: Request, props: { params: Promise<{ action: string }> }) {
  try {
    const session = await requireAdmin();
    const action = actions[(await props.params).action];
    if (!action) return NextResponse.json({ error: 'Unknown operation.' }, { status: 404 });
    const result = await action(await request.json(), session.staffId ?? 'admin');
    revalidatePath('/rent-to-own', 'layout'); revalidatePath('/vehicles');
    return NextResponse.json({ result });
  } catch (error) { return handleApiError(error); }
}
