import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MonitoringTestButton } from '@/components/operations/monitoring-test-button';
export const dynamic = 'force-dynamic';
export default async function MonitoringPage() {
  const session = await auth();
  if (session?.staffRole !== 'ADMIN') redirect('/');
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">Monitoring</h1>
    <p>Server error reporting: {process.env.SENTRY_DSN ? 'Configured' : 'Not configured'}. Browser error reporting: {process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured' : 'Not configured'}.</p>
    <p>Database monitor credential: {(process.env.MONITORING_SECRET?.length || 0) >= 32 ? 'Configured' : 'Not configured'}.</p>
    <p>Configuration does not prove delivery. Send a test and confirm its issue in Sentry and the alert email at drash1731@gmail.com. Verify the external database monitor reports a successful check after deployment.</p>
    <MonitoringTestButton />
  </div>;
}
