'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export function MonitoringTestButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function send() {
    setBusy(true);
    try {
      const response = await fetch('/api/monitoring-test', { method: 'POST' });
      const result = await response.json();
      setMessage(response.ok ? `${result.message} Event: ${result.eventId}` : result.error || 'Unable to dispatch test.');
    } catch { setMessage('Unable to reach monitoring. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3"><Button disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send test error'}</Button><p role="status">{message}</p></div>;
}
