export const dynamic = "force-dynamic";

import { getServiceStatusWithEstimates } from "@/lib/db/service";
import { ServiceTable } from "@/components/service/service-table";
import { PageHeader } from "@/components/shared/page-header";

export default async function ServicePage() {
  const rows = await getServiceStatusWithEstimates();

  return (
    <div className="space-y-6">
      <PageHeader title="Service Status" description="Fully computed from your Transactions log." />
      <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-ink-secondary">
        Service records are entered via the Transactions log (Category → Service).
      </div>
      <ServiceTable rows={rows} />
    </div>
  );
}
