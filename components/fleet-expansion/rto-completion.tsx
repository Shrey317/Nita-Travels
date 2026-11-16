import type { getRtoAgreement } from '@/lib/db/rto';
import { money, sumMoney } from '@/lib/rto';
import { ActionForm, DocumentForm } from './action-form';
import { day, zar } from './presentation';
export function RtoCompletion({agreement:a,admin}:{agreement:Awaited<ReturnType<typeof getRtoAgreement>>;admin:boolean}) {
  const balance=sumMoney([a.scheduledBalance,a.depositRemaining,a.chargeBalance]);
  const credit=sumMoney([a.unallocatedRent,a.unallocatedCharges]);
  const checks:[string,boolean][]=[['All scheduled rent paid',money(a.scheduledBalance).isZero()],['Deposit paid',money(a.depositRemaining).isZero()],['Extra charges paid',money(a.chargeBalance).isZero()],['All weeks elapsed',a.completedWeeks===a.weeks],['Time off road closed',!a.downtime.some(d=>!d.endsAt)],['Signed agreement attached',a.documents.some(d=>d.kind==='SIGNED_CONTRACT')],['No unused payment credit',credit.isZero()]];
  const ready=checks.every(([,ok])=>ok)&&['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(a.status);
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Finish agreement</h2><p className="text-xl">Final balance: {zar(balance)}</p><p>Rent {zar(a.scheduledBalance)} · Deposit {zar(a.depositRemaining)} · Extra charges {zar(a.chargeBalance)}</p><p>Unused payment credit: {zar(credit)} · Final week: {day(a.completionDate)}</p><ul className="space-y-2">{checks.map(([label,ok])=><li key={label}>{ok?'✓':'Needs attention:'} {label}</li>)}</ul>
    <a className="inline-block underline" href={`/rent-to-own/agreements/${a.id}/statement`}>Review final statement</a>
    <h3 className="font-semibold">Agreement and ownership paperwork</h3><p>Review and attach any ownership or handover paperwork here. Completing this record does not transfer legal ownership.</p>
    {a.documents.map(d=><a key={d.id} className="block break-words underline" href={`/api/private-documents?scope=RTO&id=${d.id}`}>{d.title} · {day(d.createdAt)}</a>)}
    {admin && a.status!=='COMPLETED' && <DocumentForm scope="RTO" recordId={a.id} successHref={`/rent-to-own/agreements/${a.id}?tab=completion`}/>}
    {a.status==='COMPLETED' ? <p>Completed {day(a.resolvedAt)} · {a.resolution}</p> : admin && ready ? <ActionForm successHref={`/rent-to-own/agreements/${a.id}?tab=completion`} title="Complete agreement" endpoint="/api/rent-to-own/status" fixed={{agreementId:a.id,status:'COMPLETED'}} fields={[{name:'reason',label:'Confirm the final balance and paperwork were checked'}]} description="This closes the agreement. Its receipts and files stay available. Payment reversals then require a separate reviewed correction."/> : <p>Complete the checks above before closing. Early payoff uses the separate review process.</p>}
  </section>;
}
