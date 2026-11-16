import type { getRtoAgreement } from '@/lib/db/rto';
import { installmentBalance } from '@/lib/rto';
import { day, zar } from './presentation';
type Agreement = Awaited<ReturnType<typeof getRtoAgreement>>;
export function RtoCosts({ agreement: a }: { agreement: Agreement }) {
  return <section className="my-6"><h2 className="text-xl font-semibold">Repair costs</h2><p className="my-3 text-sm">The remaining bill after insurance recovery is shared equally. Driver payments go towards the oldest unpaid extra charge first.</p>
    <div className="grid gap-4 lg:grid-cols-2">{a.repairs.map(r => {
      const charge=a.charges.find(c=>c.sourceKey===`repair:${r.id}`);
      const left=charge ? installmentBalance(charge.amount,charge.allocations) : r.driverAmount;
      const invoiced=['INVOICED','PAID'].includes(r.status);
      return <article key={r.id} className="min-w-0 rounded-xl border border-border p-4"><h3 className="break-words font-semibold">{r.description}</h3><p className="text-sm">{day(r.date)} · {r.workshop}</p>
        {invoiced ? <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">{[
          ['Repair bill',zar(r.invoiceAmount)],['Insurance recovery',zar(r.recoveryAmount)],['Company share',zar(r.companyAmount)],['Company paid',r.companyPaidDate ? `${zar(r.companyAmount)} · ${day(r.companyPaidDate)}` : zar(0)],['Company still owes',zar(r.companyPaidDate ? 0 : r.companyAmount)],['Driver share',zar(r.driverAmount)],['Driver paid',zar(r.driverAmount.minus(left))],['Driver still owes',zar(left)],
        ].map(([label,value])=><div key={label}><dt className="text-muted">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl> : <p className="mt-3">{r.status==='QUOTED' ? 'Waiting for approval' : 'Waiting for final invoice'} · Quote {zar(r.quotation)} · Approved {zar(r.approvedAmount)}. No driver charge yet.</p>}
      </article>;
    })}</div>{!a.repairs.length && <p className="mt-3">No repair costs recorded.</p>}
  </section>;
}
