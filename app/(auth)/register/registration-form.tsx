"use client";
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReadyFieldset } from '@/components/shared/ready-fieldset';
import { STAFF_PASSWORD_MIN_LENGTH, STAFF_PASSWORD_MAX_LENGTH } from '@/lib/staff-registration';

export function RegistrationForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [complete, setComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      <div>
        <label htmlFor="registration-password" className="block">Password</label>
        <div className="relative">
          <Input id="registration-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={STAFF_PASSWORD_MIN_LENGTH} maxLength={STAFF_PASSWORD_MAX_LENGTH} className="pr-20" />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} aria-controls="registration-password" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 px-4 text-sm text-muted hover:text-ink focus-visible:outline focus-visible:outline-2">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <p className="text-sm text-muted">Use 12–72 characters. Once your account is approved, you can request a password-reset link using this email.</p>
      <Button type="submit" disabled={pending}>{pending ? 'Submitting...' : 'Request access'}</Button>
    </ReadyFieldset>}
    <p role="status">{message}</p>
  </form>;
}
