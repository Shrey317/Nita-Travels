import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { DataTable, day } from './presentation';
export async function VehicleModuleHistory({ vehicleId, isAdmin }: { vehicleId: string; isAdmin: boolean }) {
  const [assignment, agreements, transfers] = await Promise.all([
    prisma.vehicleAssignment.findFirst({ where: { vehicleId, endsAt: null } }),
    prisma.rtoAgreement.findMany({ where: { vehicleId }, select: { id: true, number: true, status: true }, orderBy: { createdAt: 'desc' } }),
    prisma.vehicleTransfer.findMany({ where: { vehicleId }, orderBy: { effectiveAt: 'desc' } }),
  ]);
  return <section className="rounded-xl border border-border p-4"><h2 className="text-lg font-semibold">Operating module & retained history</h2><p className="my-2 text-sm">Current module: {(assignment?.module ?? 'NORMAL_RENTAL').replaceAll('_', ' ')}. This profile retains Normal Rental financial history.</p>
    <div className="flex flex-wrap gap-3 text-sm">{agreements.map(a => <Link key={a.id} className="underline" href={`/rent-to-own/agreements/${a.id}`}>{a.number} · {a.status}</Link>)}{isAdmin && <><Link href="/rent-to-own/manage" className="underline">Transfer vehicle</Link><Link href={`/bank-finance?vehicleId=${vehicleId}`} className="underline">Private bank finance</Link></>}</div>
    {transfers.length > 0 && <details className="mt-4"><summary className="cursor-pointer">Transfer & handover history</summary><DataTable headers={['Effective date', 'From', 'To', 'Odometer', 'Condition', 'Resolution']} rows={transfers.map(t => [day(t.effectiveAt), t.fromModule, t.toModule, t.odometerKm, t.condition, t.resolution])} /></details>}
  </section>;
}
