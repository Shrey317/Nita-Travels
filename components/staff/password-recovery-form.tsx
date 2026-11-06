'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReadyFieldset } from '@/components/shared/ready-fieldset';

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!reset) return;
    const readToken = () => {
      const value = window.location.hash.slice(1);
      if (!value) return;
      setToken(value); setDone(false); setMessage('');
      window.history.replaceState(null, '', window.location.pathname);
    };
    readToken();
    window.addEventListener('hashchange', readToken);
    return () => window.removeEventListener('hashchange', readToken);
  }, [reset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const body = reset ? { action: 'reset', token, password: form.get('password') } : { action: 'request', email: form.get('email') };
      const response = await fetch('/api/password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error || 'Please try again.');
      setDone(response.ok);
    } catch { setMessage('Connection failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg space-y-5 px-6 py-16">
    <h1 className="text-2xl font-semibold">{reset ? 'Choose a new password' : 'Reset your password'}</h1>
    <p className="text-sm text-muted">For active manager accounts registered with an email address. Administrators and username-only accounts should contact the system owner.</p>
    {!done && <form onSubmit={submit}><ReadyFieldset label="Password recovery" className="space-y-4">
      {reset ? <><label className="block">New password<Input name="password" type={show ? 'text' : 'password'} required minLength={12} maxLength={72} autoComplete="new-password" /></label><button type="button" aria-pressed={show} onClick={() => setShow(value => !value)}>{show ? 'Hide password' : 'Show password'}</button></> : <label className="block">Email address<Input name="email" type="email" required maxLength={254} autoComplete="email" /></label>}
      <Button disabled={busy || (reset && !token)} type="submit">{busy ? 'Submitting…' : reset ? 'Save new password' : 'Send reset link'}</Button>
    </ReadyFieldset></form>}
    <p role="status">{message}</p>
    <Link className="underline" href="/login">Back to sign in</Link>
  </main>;
}
