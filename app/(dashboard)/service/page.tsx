export const dynamic = "force-dynamic";

import { getServiceStatusWithEstimates } from "@/lib/db/service";
import { ServiceTable } from "@/components/service/service-table";

export default async function ServicePage() {
  const rows = await getServiceStatusWithEstimates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Service Status</h1>
        <p className="text-sm text-muted">Fully computed from your Transactions log.</p>
      </div>
      <div className="rounded-xl border border-status-yellow/30 bg-status-yellow/5 p-4 text-sm text-ink">
        Service records are entered via the Transactions log (Category → Service).
      </div>
      <ServiceTable rows={rows} />
    </div>
  );
}
