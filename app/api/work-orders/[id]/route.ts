import { changeRoute } from '@/lib/change-route';
type Props = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, props: Props) { return changeRoute(request, (await props.params).id, 'workOrder', 'record'); }
export async function DELETE(request: Request, props: Props) { return changeRoute(request, (await props.params).id, 'workOrder', 'record'); }
