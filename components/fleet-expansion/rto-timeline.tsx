import type { getRtoAgreement } from '@/lib/db/rto';
import { depositPart } from '@/lib/rto-deposit';
import { day, zar } from './presentation';
export function RtoTimeline({agreement:a}:{agreement:Awaited<ReturnType<typeof getRtoAgreement>>}) {
 const events=[
 ...a.auditHistory.filter(e=>e.action.includes('FOLLOW_UP')).map(e=>({id:e.id,date:e.createdAt,text:e.action==='FOLLOW_UP_DONE'?'Follow-up marked done':`Follow-up: ${(e.detail as {note?:string}).note ?? 'Added'}`,tab:'overview'})),
 ...a.payments.map(p=>({id:p.id,date:p.date,text:`Payment ${p.reference}: ${zar(p.amount)} · deposit ${zar(depositPart(p))}${p.reversedAt?' (undone)':''}`,tab:'payments'})),
 ...a.repairs.map(r=>({id:r.id,date:r.date,text:`Repair: ${r.description} · ${zar(r.invoiceAmount)}`,tab:'costs'})),
 ...a.services.map(r=>({id:r.id,date:r.date,text:`Service: ${r.description}`,tab:'costs'})),
 ...a.mileage.map(r=>({id:r.id,date:r.date,text:`Mileage: ${r.odometerKm.toLocaleString()} km`,tab:'mileage'})),
 ...a.documents.map(r=>({id:r.id,date:r.createdAt,text:`File: ${r.title}`,tab:'documents'})),
 ].sort((x,y)=>+y.date-+x.date).slice(0,20);
 return <section className="my-5"><h2 className="text-xl font-semibold">Recent activity</h2><ol className="mt-3 space-y-3">{events.map(e=><li key={`${e.tab}-${e.id}`} className="rounded-lg border border-border p-3"><p className="text-sm text-muted">{day(e.date)}</p><a className="break-words underline" href={`/rent-to-own/agreements/${a.id}?tab=${e.tab}`}>{e.text}</a></li>)}</ol>{!events.length&&<p>No activity yet.</p>}</section>;
}
