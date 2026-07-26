import { TimelineFilters } from "@/components/vehicles/timeline-filters";
import { ActivityTimelineTable } from "@/components/vehicles/activity-timeline-table";
import { Pagination } from "@/components/shared/pagination";
import type { TimelineResult } from "@/lib/db/vehicles";

export function ActivityTimeline({ timeline }: { timeline: TimelineResult }) {
  return (
    <div className="space-y-4">
      <TimelineFilters />
      <ActivityTimelineTable items={timeline.items} />
      <Pagination page={timeline.page} limit={timeline.limit} total={timeline.total} />
    </div>
  );
}
