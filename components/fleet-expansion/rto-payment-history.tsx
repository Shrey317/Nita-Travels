import { sumMoney } from '@/lib/rto';
import type { getRtoAgreement } from '@/lib/db/rto';
import { depositPart, rentPart } from '@/lib/rto-deposit';
import { ActionForm } from './action-form';
import { day, zar } from './presentation';
export function RtoPaymentHistory({agreement:a,admin}:{agreement:Awaited<ReturnType<typeof getRtoAgreement>>;admin:boolean}) {
  return <section className="my-6"><h2 className="text-xl font-semibold">Payment history</h2><p className="my-3 text-sm">Undo a wrong receipt, then add the correct payment. The original stays in the history.</p>
    <div className="grid gap-4 lg:grid-cols-2">{a.payments.map(p=><article aria-label={`Payment ${p.reference}`} key={p.id} className="min-w-0 rounded-xl border border-border p-4">
      <h3 className="break-all font-semibold">{p.reference}</h3><p>{day(p.date)} · {p.method}</p><p className="my-2 text-xl font-semibold">{zar(p.amount)}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt>Rent</dt><dd>{zar(rentPart(p))}</dd></div><div><dt>Deposit</dt><dd>{zar(depositPart(p))}</dd></div>{p.kind==='CHARGE' && <div><dt>Extra charges</dt><dd>{zar(p.amount)}</dd></div>}</dl>
      <p className="my-3 break-words">{p.reversedAt ? `Undone ${day(p.reversedAt)}: ${p.reversalReason}` : 'Recorded'}</p>
      <a className="mb-3 inline-block underline" href={`/rent-to-own/agreements/${a.id}/statement?payment=${p.id}`}>View receipt</a>
      {admin && !p.reversedAt && a.status!=='COMPLETED' && <ActionForm successHref={`/rent-to-own/agreements/${a.id}?tab=payments`} title="Undo payment" endpoint="/api/rent-to-own/reversal" fixed={{paymentId:p.id}} fields={[{name:'reason',label:'Reason'}]} description={`Undo ${p.reference} (${zar(p.amount)}). Rent balance increases by ${zar(sumMoney(p.allocations.filter(x=>x.installmentId).map(x=>x.amount)))}; deposit left increases by ${zar(depositPart(p))}; extra charges increase by ${zar(p.kind === 'CHARGE' ? sumMoney(p.allocations.map(x=>x.amount)) : 0)}. The original receipt remains visible.`} />}
    </article>)}</div>{!a.payments.length && <p>No payments recorded.</p>}
  </section>;
}
