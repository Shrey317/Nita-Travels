'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function AdministratorRecoveryPage() {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setToken(window.location.hash.slice(1)); window.history.replaceState(null, '', window.location.pathname); }, []);
  async function submit() {
    setBusy(true);
    try {
      const response = await fetch('/api/admin-recovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(token ? { action: 'verify', token } : { action: 'setup' }) });
      const data = await response.json();
      setMessage(data.message || data.error || 'Please try again.');
    } catch { setMessage('Connection failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg space-y-4 px-6 py-16"><h1 className="text-2xl font-semibold">Administrator recovery</h1><p>Setup requires an administrator session. Verification goes to nitatravels.sa@gmail.com. After verification, administrator passwords are managed in the database and the old deployment password no longer overrides them.</p><Button disabled={busy} onClick={submit}>{busy ? 'Submitting…' : token ? 'Verify recovery address' : 'Send verification email'}</Button><p role="status">{message}</p><Link href="/login" className="underline">Sign in</Link></main>;
}
