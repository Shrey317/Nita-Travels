"use client";
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReadyFieldset } from '@/components/shared/ready-fieldset';

export function RegistrationForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setMessage('');
    try {
      const response = await fetch('/api/staff/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json();
      setMessage(response.ok ? result.message : result.error ?? 'Registration could not be submitted.');
      setComplete(response.ok);
    } catch { setMessage('Connection failed. Please try again.'); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="mt-6 space-y-4">
    {!complete && <ReadyFieldset label="Manager registration" className="space-y-4">
      <label className="block">Full name<Input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label className="block">Email address<Input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label className="block">Password<Input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} /></label>
      <p className="text-sm text-muted">Use 12–72 characters. Password recovery by email is not available yet.</p>
      <Button type="submit" disabled={pending}>{pending ? 'Submitting...' : 'Request access'}</Button>
    </ReadyFieldset>}
    <p role="status">{message}</p>
  </form>;
}
