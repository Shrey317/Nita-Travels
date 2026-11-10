import { RegisterPage } from '@/components/operations/register-page';
export const dynamic = 'force-dynamic';
export default function DocumentsPage(props: { searchParams: Promise<{ page?: string; vehicleId?: string }> }) { return <RegisterPage mode="documents" searchParams={props.searchParams} />; }
