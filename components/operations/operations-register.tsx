'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReadyFieldset } from '@/components/shared/ready-fieldset';
import { downtimeDays, workOrderStatus } from '@/lib/operations';

type Row = Record<string, unknown> & { id: string; vehicleId: string; title: string };
type Field = { key: string; label: string; type?: string; options?: string[]; required?: boolean };
const documentFields: Field[] = [
  { key: 'title', label: 'Document title', required: true }, { key: 'documentType', label: 'Document type', options: ['Insurance','Licence','Roadworthy','Registration','Other'] },
  { key: 'reference', label: 'Reference number' }, { key: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
];
const workFields: Field[] = [
  { key: 'title', label: 'Work description', required: true }, { key: 'kind', label: 'Work type', options: ['SERVICE','REPAIR'] },
  { key: 'plannedDate', label: 'Planned date', type: 'date', required: true }, { key: 'targetMileageKm', label: 'Target odometer (km)', type: 'number' },
  { key: 'workshop', label: 'Workshop' }, { key: 'startedDate', label: 'Unavailable / actual start date', type: 'date' },
  { key: 'completedDate', label: 'Returned to service / completion date', type: 'date' }, { key: 'notes', label: 'Notes' },
  { key: 'expenseTransactionId', label: 'Recorded expense (optional)' },
];
export function OperationsRegister({ mode, rows, vehicles, expenses, isAdmin, today }: { mode: 'documents' | 'work-orders'; rows: Row[]; vehicles: { id: string; registration: string }[]; expenses: { id: string; vehicleId: string | null; date: string; expenseZarCents: number }[]; isAdmin: boolean; today: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const [vehicleChoice, setVehicleChoice] = useState('');
  const fields = mode === 'documents' ? documentFields : workFields;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { vehicleId: form.get('vehicleId') };
    for (const field of fields) {
      const value = String(form.get(field.key) || '');
      body[field.key] = field.type === 'number' ? value ? Number(value) : null : value || null;
    }
    if (mode === 'documents') body.photoUrls = editing?.photoUrls || [];
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/${mode}${editing ? '/' + editing.id : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save.');
      setMessage(result.pendingApproval ? 'Submitted for admin approval. The original record is unchanged.' : 'Saved successfully.');
      setEditing(null); setVehicleChoice(''); setFormVersion(value => value + 1); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function archive(row: Row) {
    if (busy || !window.confirm(isAdmin ? 'Archive this record? History remains in the database.' : 'Request administrator approval to archive this record?')) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/${mode}/${row.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to archive.');
      setMessage(result.pendingApproval ? 'Archive request submitted for admin approval.' : 'Record archived.');
      if (editing?.id === row.id) { setEditing(null); setVehicleChoice(''); setFormVersion(value => value + 1); }
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <p role="status">{message}</p>
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-4 font-semibold">{editing ? 'Edit record' : 'Add record'}</h2>
      <form key={editing?.id || 'new-' + formVersion} onSubmit={save}><ReadyFieldset label="Register entry" className="grid gap-4 sm:grid-cols-2">
        <label>Vehicle<select aria-label="Vehicle" name="vehicleId" required defaultValue={editing?.vehicleId || ''} onChange={event => setVehicleChoice(event.target.value)} className="block w-full rounded border border-border bg-background p-2"><option value="">Select vehicle</option>{vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.id} · {vehicle.registration}</option>)}</select></label>
        {fields.map(field => <label key={field.key}>{field.label}{field.options ? <select aria-label={field.label} name={field.key} defaultValue={String(editing?.[field.key] || field.options[0])} className="block w-full rounded border border-border bg-background p-2">{field.options.map(value => <option key={value}>{value}</option>)}</select> :
          field.key === 'expenseTransactionId' ? <select aria-label={field.label} key={vehicleChoice} name={field.key} defaultValue={String(editing?.expenseTransactionId || '')} className="block w-full rounded border border-border bg-background p-2"><option value="">No linked expense</option>{expenses.filter(expense => expense.vehicleId === (vehicleChoice || editing?.vehicleId)).map(expense => <option key={expense.id} value={expense.id}>{expense.date} · R{(expense.expenseZarCents / 100).toFixed(2)}</option>)}{editing?.expenseTransactionId && !expenses.some(expense => expense.id === editing.expenseTransactionId) ? <option value={String(editing.expenseTransactionId)}>Previously linked expense</option> : null}</select> :
          <Input aria-label={field.label} name={field.key} type={field.type || 'text'} required={field.required} min={field.type === 'number' ? 0 : undefined} maxLength={field.type ? undefined : field.key === 'notes' ? 5000 : 150} defaultValue={String(editing?.[field.key] ?? '')} />}</label>)}
        <div className="flex gap-2"><Button disabled={busy} type="submit">{busy ? 'Saving…' : editing && !isAdmin ? 'Request changes' : 'Save record'}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setVehicleChoice(''); }}>Cancel edit</Button>}</div>
      </ReadyFieldset></form>
      {mode === 'work-orders' && <p className="mt-3 text-sm text-muted">Choose from the latest 200 recorded expenses. Work orders do not add another expense. Start and completion dates measure calendar-day unavailability; same-day work is 0 days. Overlapping jobs must not be added together as fleet downtime.</p>}
    </section>
    {rows.length === 0 && <p>No records match this page.</p>}
    {rows.map(row => {
      const expiry = String(row.expiryDate || '');
      const status = mode === 'documents' ? expiry < today ? 'Expired' : expiry === today ? 'Expires today' : 'Valid' : workOrderStatus(row.startedDate as string | null, row.completedDate as string | null);
      const days = mode === 'work-orders' ? downtimeDays(row.startedDate as string | null, row.completedDate as string | null, today) : null;
      return <article id={row.id} key={row.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">{row.vehicleId} · {row.title}</h2><p>{status}{days !== null ? ` · ${days} calendar days unavailable` : ''}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-muted">{field.label}</dt><dd className="break-words">{String(row[field.key] ?? '—')}</dd></div>)}</dl>
        {row.expenseTransactionId ? <Link className="underline" href={`/transactions?txId=${row.expenseTransactionId}`}>View linked expense</Link> : null}
        <div className="flex gap-2"><Button disabled={busy} variant="outline" onClick={() => { setEditing(row); setVehicleChoice(row.vehicleId); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{isAdmin ? 'Edit' : 'Request edit'}</Button><Button disabled={busy} variant="outline" onClick={() => archive(row)}>{isAdmin ? 'Archive' : 'Request archive'}</Button></div>
      </article>;
    })}
  </div>;
}
