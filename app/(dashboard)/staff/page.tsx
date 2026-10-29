import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.staffRole !== 'ADMIN') redirect('/');
  const accounts = await prisma.staffAccount.findMany({
    select: { id: true, name: true, email: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' }, take: 100,
  });
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Manager registrations</h1>
    <p className="text-muted">Latest 100 registration requests. Account activation is not available yet.</p>
    {accounts.length === 0 && <p>No registration requests yet.</p>}
    <ul className="space-y-3">{accounts.map(account => <li key={account.id} className="rounded-xl border border-border bg-card p-4">
      <p className="font-semibold">{account.name}</p>
      <p className="break-all">{account.email}</p>
      <p className="text-sm text-muted">{account.status} · {account.createdAt.toISOString().slice(0, 10)}</p>
    </li>)}</ul>
  </section>;
}
