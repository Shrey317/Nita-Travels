import Link from 'next/link';
import { requireSession } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { ApprovalReview } from '@/components/staff/approval-review';

export const dynamic = 'force-dynamic';
export default async function ApprovalsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.staffRole === 'ADMIN';
  const pageNumber = Number((await props.searchParams).page || 1);
  const page = Number.isSafeInteger(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, 100000) : 1;
  const where = isAdmin ? {} : { requestedBy: session.staffId! };
  const [requests, total] = await Promise.all([
    prisma.changeRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 25, take: 25 }),
    prisma.changeRequest.count({ where }),
  ]);
  const staff = await prisma.staffAccount.findMany({ where: { id: { in: requests.map(row => row.requestedBy) } }, select: { id: true, name: true } });
  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">{isAdmin ? 'Change approvals' : 'My change requests'}</h1>
    <p className="text-sm text-muted">Pending requests leave the original record unchanged until an administrator approves them.</p>
    {requests.length === 0 && <p>No change requests.</p>}
    {requests.map(row => <ApprovalReview key={row.id} isAdmin={isAdmin} item={{
      ...row, createdAt: row.createdAt.toISOString(),
      requester: row.requestedBy === 'admin' ? 'Administrator' : staff.find(person => person.id === row.requestedBy)?.name || 'Former staff member',
    }} />)}
    <nav aria-label="Approval pages" className="flex gap-4">
      {page > 1 && <Link href={`/approvals?page=${page - 1}`}>Previous</Link>}
      {page * 25 < total && <Link href={`/approvals?page=${page + 1}`}>Next</Link>}
    </nav>
  </div>;
}
