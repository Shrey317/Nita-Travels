import { changeRoute } from '@/lib/change-route';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, props: Props) {
  return changeRoute(request, (await props.params).id, 'transaction', 'transaction');
}

export async function DELETE(request: Request, props: Props) {
  return changeRoute(request, (await props.params).id, 'transaction', 'transaction');
}
