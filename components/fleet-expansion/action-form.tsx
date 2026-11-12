'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export type Field = { name: string; label: string; type?: string; value?: string | number; options?: { value: string; label: string }[]; optional?: boolean; help?: string };
export function ActionForm({ title, endpoint, fields, fixed = {}, description, initiallyOpen = false, successHref }: { title: string; endpoint: string; fields: Field[]; fixed?: Record<string, string>; description?: string; initiallyOpen?: boolean; successHref?: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [key, setKey] = useState<string | null>(null);
  return <details open={initiallyOpen || undefined} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer font-semibold">{title}</summary>
    {description && <p className="mt-3 text-sm text-muted">{description}</p>}
    <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async event => {
      event.preventDefault(); setPending(true); setError(''); setSuccess('');
      const form = event.currentTarget; const values = new FormData(form); const body: Record<string, unknown> = { ...fixed };
      const token = key ?? crypto.randomUUID(); setKey(token);
      for (const field of fields) { const value = String(values.get(field.name) ?? ''); if (value !== '') body[field.name] = field.type === 'number' ? Number(value) : field.type === 'datetime-local' ? new Date(value).toISOString() : value; }
      body.idempotencyKey = token;
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Unable to save.');
        setKey(null); setSuccess('Saved successfully.'); form.reset(); router.refresh(); if (successHref) router.push(successHref);
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save.'); } finally { setPending(false); }
    }}>
      {fields.map(field => <label key={field.name} className="grid gap-1 text-sm">{field.label}{field.optional ? ' (optional)' : ''}
        {field.options ? <select name={field.name} required={!field.optional} defaultValue={field.value ?? ''} className="h-10 rounded-md border border-border bg-background px-3"><option value="">Select…</option>{field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          : <Input name={field.name} type={field.type ?? 'text'} required={!field.optional} defaultValue={field.value} step={field.type === 'number' ? '1' : undefined} />}
        {field.help && <span className="text-xs text-muted">{field.help}</span>}
      </label>)}
      <div className="sm:col-span-2"><Button disabled={pending} type="submit">{pending ? 'Saving…' : title}</Button><p role="alert" className="mt-2 text-sm text-red-600">{error}</p><p role="status" className="text-sm text-teal">{success}</p></div>
    </form></details>;
}
export function DocumentForm({ scope, recordId }: { scope: 'BANK' | 'RTO'; recordId: string }) {
  const router = useRouter(); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  return <form className="space-y-3 rounded-xl border border-border p-4" onSubmit={async event => {
    event.preventDefault(); const data = new FormData(event.currentTarget); data.set('scope', scope); data.set('recordId', recordId); setPending(true);
    try { const response = await fetch('/api/private-documents', { method: 'POST', body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setMessage('Document attached.'); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); } finally { setPending(false); }
  }}><h3 className="font-semibold">Attach private document</h3><p className="text-sm text-muted">PDF, JPEG or PNG, up to 2 MB. Downloads require an authorised session.</p>
    {scope === 'RTO' && <label className="block text-sm">Document type<select name="kind" className="ml-2 rounded border bg-background p-2"><option value="SIGNED_CONTRACT">Signed contract</option><option value="RECEIPT">Receipt / invoice</option><option value="ODOMETER">Odometer photo</option><option value="SUPPORTING">Supporting document</option></select></label>}
    <label className="block text-sm">File<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required className="block max-w-full" /></label><Button disabled={pending}>{pending ? 'Uploading…' : 'Attach document'}</Button><p role="status">{message}</p>
  </form>;
}
