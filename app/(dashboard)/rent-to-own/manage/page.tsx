import Link from 'next/link';
import { requireAdmin } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { ActionForm, DocumentForm } from '@/components/fleet-expansion/action-form';
import { DataTable, ModuleHeader, day, zar } from '@/components/fleet-expansion/presentation';
export const dynamic = 'force-dynamic';
export default async function ManageRto({searchParams}:{searchParams:Promise<{vehicleId?:string;driverId?:string;agreementId?:string}>}) {
  await requireAdmin(); const q=await searchParams;
  const [vehicles,drivers,assignments,drafts,agreement,transfers]=await Promise.all([
    prisma.vehicle.findMany({where:{active:true,deletedAt:null},select:{id:true,registration:true,modelYear:true},orderBy:{id:'asc'}}),
    prisma.rtoDriver.findMany({orderBy:{name:'asc'}}), prisma.vehicleAssignment.findMany({where:{endsAt:null}}),
    prisma.rtoAgreement.findMany({where:{status:'DRAFT'},select:{id:true,number:true},orderBy:{createdAt:'desc'}}),
    q.agreementId ? prisma.rtoAgreement.findUnique({where:{id:q.agreementId},include:{driver:true,documents:{select:{id:true,title:true,kind:true}}}}) : null,
    prisma.vehicleTransfer.findMany({orderBy:{effectiveAt:'desc'},take:100}),
  ]);
  const vehicleOptions=vehicles.map(v=>({value:v.id,label:`${v.id} · ${v.registration}`}));
  const eligible=vehicles.filter(v=>assignments.some(a=>a.vehicleId===v.id&&a.module==='RENT_TO_OWN'));
  const car=eligible.find(v=>v.id===(agreement?.vehicleId??q.vehicleId));
  const driver=drivers.find(d=>d.id===(agreement?.driverId??q.driverId));
  const signed=agreement?.documents.some(d=>d.kind==='SIGNED_CONTRACT');
  const step=agreement ? agreement.status!=='DRAFT' ? 5 : signed ? 5 : 4 : car ? driver ? 3 : 2 : 1;
  return <><ModuleHeader title="Set up Rent-to-Own" description="Choose the car and driver, save the agreement, attach the signed copy, then start. Each saved step is kept." />
    <ol aria-label="Setup progress" className="mb-6 grid gap-2 sm:grid-cols-5">{['Car','Driver','Agreement','Signed file','Start'].map((label,i)=><li key={label} aria-current={step===i+1?'step':undefined} className={`rounded-lg border p-3 ${step===i+1?'border-primary font-semibold':'border-border'}`}>{i+1}. {label} {step>i+1?'✓':''}</li>)}</ol>
    {car && <p className="mb-3">Car: {car.id} · {car.registration}{driver ? ` · Driver: ${driver.name}`:''}</p>}
    {!agreement && <Link className="mb-4 inline-block underline" href="/rent-to-own/manage">Choose a different car or driver</Link>}
    {step===1 && <section className="space-y-4"><h2 className="text-xl font-semibold">1. Choose a car</h2><form className="flex flex-wrap gap-3"><label>RTO car<select required name="vehicleId" className="ml-2 rounded border bg-background p-2"><option value="">Select…</option>{eligible.map(v=><option key={v.id} value={v.id}>{v.id} · {v.registration}</option>)}</select></label><button className="rounded bg-primary px-4 py-2 text-white">Continue to driver</button></form><Link className="inline-block underline" href="/rent-to-own/vehicles/new?setup=1">Add a new car</Link></section>}
    {step===2 && car && <section className="space-y-4"><h2 className="text-xl font-semibold">2. Choose or add a driver</h2><form className="flex flex-wrap gap-3"><input type="hidden" name="vehicleId" value={car.id}/><label>Existing driver<select required name="driverId" className="ml-2 rounded border bg-background p-2"><option value="">Select…</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><button className="rounded bg-primary px-4 py-2 text-white">Continue to agreement</button></form><ActionForm title="Add driver" endpoint="/api/rent-to-own/drivers" successHref={`/rent-to-own/manage?vehicleId=${encodeURIComponent(car.id)}&driverId={id}`} fields={[{name:'name',label:'Full name'},{name:'phone',label:'Phone'},{name:'email',label:'Email',type:'email',optional:true},{name:'licenceReference',label:'Driving licence reference'}]} /></section>}
    {step===3 && car && driver && <ActionForm title="Save agreement" initiallyOpen endpoint="/api/rent-to-own/agreements" fixed={{vehicleId:car.id,driverId:driver.id}} successHref="/rent-to-own/manage?agreementId={id}" description="Deposit: R8,000 upfront or R650 with each weekly rent payment until paid off. Saving does not start the agreement." fields={[{name:'number',label:'Agreement number'},{name:'modelYear',label:'Model year',type:'number',value:car.modelYear??2025},{name:'weeklyAmount',label:'Weekly rent (R)',value:(car.modelYear??2025)>=2025?'2850':'2650'},{name:'upfrontRequired',label:'Total deposit (R)',value:'8000'},{name:'weeks',label:'Weeks',type:'number',value:234},{name:'startDate',label:'Start date',type:'date'}]} />}
    {agreement && <section className="space-y-4 rounded-xl border border-border p-4"><h2 className="text-xl font-semibold">{agreement.number}</h2><p>Start {day(agreement.startDate)} · {zar(agreement.weeklyAmount)} weekly rent · {agreement.weeks} weeks · Deposit {zar(agreement.upfrontRequired)}</p>
      {agreement.documents.map(d=><a key={d.id} className="block underline" href={`/api/private-documents?scope=RTO&id=${d.id}`}>{d.title}</a>)}
      {agreement.status==='DRAFT' ? <>{!signed ? <><h3 className="font-semibold">4. Attach the signed agreement</h3><DocumentForm scope="RTO" recordId={agreement.id} successHref={`/rent-to-own/manage?agreementId=${agreement.id}`}/></> : <><h3 className="font-semibold">5. Review and start</h3><p>Check the car, driver, dates, rent and signed file above before starting.</p><ActionForm title="Start agreement" initiallyOpen endpoint="/api/rent-to-own/status" fixed={{agreementId:agreement.id,status:'ACTIVE'}} fields={[{name:'reason',label:'Start confirmation',value:'Signed agreement checked'}]} successHref={`/rent-to-own/agreements/${agreement.id}?tab=overview`}/></>}</> : <p>Setup finished. <Link className="underline" href={`/rent-to-own/agreements/${agreement.id}`}>Open agreement</Link></p>}
    </section>}
    {!!drafts.length && <details className="my-6 rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Continue a saved setup</summary>{drafts.map(d=><Link key={d.id} className="mt-3 block underline" href={`/rent-to-own/manage?agreementId=${d.id}`}>{d.number}</Link>)}</details>}
    <details className="my-6 rounded-xl border border-border p-4"><summary className="cursor-pointer">Move a car between systems</summary>
      <ActionForm title="Move an existing car" endpoint="/api/rent-to-own/transfer" description="Close the previous agreement first. The car’s old records stay in their original system." fields={[
        { name: 'vehicleId', label: 'Vehicle', options: vehicleOptions }, { name: 'toModule', label: 'Destination', options: ['RENT_TO_OWN', 'NORMAL_RENTAL', 'UNASSIGNED'].map(value => ({ value, label: value.replaceAll('_', ' ') })) },
        { name: 'effectiveAt', label: 'Effective date', type: 'date' }, { name: 'odometerKm', label: 'Final handover odometer (km)', type: 'number' }, { name: 'condition', label: 'Vehicle condition' }, { name: 'resolution', label: 'Prior agreement resolution / handover confirmation' },
      ]} />
</details><details className="my-6 rounded-xl border border-border p-4"><summary className="cursor-pointer">Car availability and registers</summary>      <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer">More options</summary>      <ActionForm title="Change car availability" endpoint="/api/rent-to-own/availability" description="Update whether the car is available. Close any time-off-road or replacement record first." fields={[{ name: 'vehicleId', label: 'Vehicle', options: vehicleOptions }, { name: 'availability', label: 'Physical availability', options: ['AVAILABLE','MAINTENANCE','UNAVAILABLE','DISPOSED'].map(value => ({ value, label: value })) }, { name: 'reason', label: 'Reason / authorisation' }]} /></details>

    <h2 className="mt-8 text-xl font-semibold">Driver register</h2><DataTable headers={['Name', 'Phone', 'Email', 'Licence reference']} rows={drivers.map(d => [d.name, d.phone, d.email ?? '—', d.licenceReference])} />
    <h2 className="mt-8 text-xl font-semibold">Transfer history</h2><DataTable headers={['Vehicle', 'From', 'To', 'Effective', 'Odometer', 'Condition', 'Resolution']} rows={transfers.map(t => [t.vehicleId, t.fromModule, t.toModule, day(t.effectiveAt), t.odometerKm, t.condition, t.resolution])} /></details></>;
}
