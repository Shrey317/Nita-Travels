import { RegisterPage } from '@/components/operations/register-page';
export const dynamic = 'force-dynamic';
export default function WorkOrdersPage(props: { searchParams: Promise<{ page?: string; vehicleId?: string }> }) { return <RegisterPage mode="work-orders" searchParams={props.searchParams} />; }
