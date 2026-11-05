'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Item = { id: string; entity: string; recordId: string; operation: string; status: string; before: unknown; proposed: unknown; requester: string; createdAt: string; reviewNote: string | null };
const fields = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const display = (value: unknown) => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);

export function ApprovalReview({ item, isAdmin }: { item: Item; isAdmin: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<{ status: string; reviewNote: string | null } | null>(null);
  const status = decision?.status ?? item.status;
  const reviewNote = decision?.reviewNote ?? item.reviewNote;
  const before = fields(item.before);
  const proposed = fields(item.proposed);
  const keys = item.operation === 'DELETE' ? Object.keys(before) : Object.keys(proposed);
  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/approvals/${item.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approve, note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to review this request.');
      setDecision({ status: data.status, reviewNote: data.reviewNote });
      router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <article className="space-y-3 rounded-xl border border-border bg-card p-4" data-request-id={item.id}>
    <h2 className="break-words font-semibold">{item.operation} {item.entity} · {item.recordId}</h2>
    <p className="text-sm">{status} · {item.requester} · {item.createdAt.slice(0, 10)}</p>
    <details><summary className="cursor-pointer">Review changes</summary>
      <p className="my-2 text-xs text-muted">Fields ending in ZarCents are amounts in cents. Deletions remove the record from active use.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr><th className="p-2">Field</th><th className="p-2">Before</th><th className="p-2">Requested</th></tr></thead>
        <tbody>{keys.map(key => <tr key={key} className="border-t border-border"><th className="p-2">{key}</th><td className="max-w-xs break-words p-2">{display(before[key])}</td><td className="max-w-xs break-words p-2">{item.operation === 'DELETE' ? 'Remove' : display(proposed[key])}</td></tr>)}</tbody>
      </table></div>
    </details>
    {reviewNote && <p className="text-sm">Review note: {reviewNote}</p>}
    {isAdmin && status === 'PENDING' && <div className="space-y-3">
      <label className="block text-sm">Review note (optional)<input className="mt-1 block w-full rounded border border-border bg-background p-2" maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => decide(true)}>Approve change</Button><Button variant="outline" disabled={busy} onClick={() => decide(false)}>Reject change</Button></div>
    </div>}
    {error && <p role="alert" className="text-sm text-status-error">{error}</p>}
  </article>;
}
