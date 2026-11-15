'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WeeklyPaymentForm({ agreementId, unpaid }: { agreementId: string; unpaid: { rent: string; deposit: string; sequence: number; dueDate: string }[] }) {
  const router = useRouter();
  const [weeks, setWeeks] = useState(1); const [amount, setAmount] = useState<string>();
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [token, setToken] = useState<string>();
  // Display arithmetic uses integer cents. The server validates the split with Decimal.
  const selected = unpaid.slice(0, weeks);
  const rent = selected.reduce((n,p) => n + Math.round(Number(p.rent) * 100),0);
  const deposit = selected.reduce((n,p) => n + Math.round(Number(p.deposit) * 100),0);
  const expected = ((rent + deposit) / 100).toFixed(2);
  if (!unpaid.length) return <div><p role="status">{message}</p><Link className="underline" href="/rent-to-own" onClick={event => { event.preventDefault(); window.location.assign('/rent-to-own'); }}>Back to drivers</Link><p className="rounded-lg border border-border p-4">No weekly payments left.</p></div>;
  return <form aria-label="Add weekly payment" className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2" onSubmit={async event => {
    event.preventDefault(); setPending(true); setMessage(''); setError('');
    const form = event.currentTarget; const data = new FormData(form); const key = token ?? crypto.randomUUID(); setToken(key);
    try {
      const response = await fetch('/api/rent-to-own/weekly-payment', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ agreementId, weeks, amount:amount ?? expected, date:data.get('date'), reference:data.get('reference'), method:data.get('method'), idempotencyKey:key }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Payment could not be saved.');
      setMessage(`Payment saved. Weeks ${selected.map(week => week.sequence).join(', ')}. Rent R${(rent / 100).toFixed(2)} + deposit R${(deposit / 100).toFixed(2)}. Total R${expected}.`); setToken(undefined); setAmount(undefined); setWeeks(1); form.reset(); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment could not be saved.'); } finally { setPending(false); }
  }}>
    <Link className="text-sm underline sm:col-span-2" href="/rent-to-own" onClick={event => { event.preventDefault(); window.location.assign('/rent-to-own'); }}>Back to drivers</Link>
    <p className="text-sm sm:col-span-2">Next unpaid week {unpaid[0]?.sequence} · due {unpaid[0]?.dueDate}</p>
    <h2 className="text-lg font-semibold sm:col-span-2">Add payment</h2>
    <label className="grid gap-2 text-sm">Date paid<input required name="date" type="date" className="rounded-lg border bg-background p-3" /></label>
    <label className="grid gap-2 text-sm">Weeks paid<select value={weeks} onChange={e => {setWeeks(Number(e.target.value));setAmount(undefined);setToken(undefined);}} className="rounded-lg border bg-background p-3">{unpaid.slice(0,52).map((_,i) => <option key={i} value={i+1}>{i+1} {i ? 'weeks' : 'week'}</option>)}</select></label>
    <p className="text-sm sm:col-span-2">Amount for selected weeks: <strong>R{expected}</strong>. Rent R{(rent/100).toFixed(2)} + deposit R{(deposit/100).toFixed(2)} = <strong>R{expected}</strong></p>
    <label className="grid gap-2 text-sm">Amount received (R)<input required name="amount" inputMode="decimal" value={amount ?? expected} onChange={e=>{setAmount(e.target.value);setToken(undefined);}} className="rounded-lg border bg-background p-3" /></label>
    <label className="grid gap-2 text-sm">Payment reference<input required name="reference" maxLength={100} className="rounded-lg border bg-background p-3" /></label>
    <label className="grid gap-2 text-sm">Paid by<select name="method" className="rounded-lg border bg-background p-3"><option>EFT</option><option>Cash</option><option>Card</option><option>Other</option></select></label>
    <div className="sm:col-span-2"><button disabled={pending} className="rounded-lg bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save payment'}</button><p role="alert" className="mt-2 text-sm text-red-600">{error}</p><p role="status" className="mt-2 text-sm text-teal">{message}</p></div>
  </form>;
}
