import { formatZAR } from "@/lib/format";
import type { AnalyticsReport } from "@/lib/db/analytics";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

export function ProfitBridge({ report }: { report: AnalyticsReport }) {
  const { profitBridge } = report;
  return <section id="profit-change" className="space-y-3 scroll-mt-20">
    <h2 className="text-lg font-semibold">Why did profit change?</h2>
    <p className="text-sm text-muted">Profit changed by <strong className="text-ink">{formatZAR(profitBridge.profitChange)}</strong>. These are numerical contributors; the records alone do not establish causes.</p>
    <Table><TableHeader><TableRow><TableHead>Contributor</TableHead><TableHead className="text-right">Previous</TableHead><TableHead className="text-right">Current</TableHead><TableHead className="text-right">Impact on profit</TableHead></TableRow></TableHeader><TableBody>
      <TableRow><TableCell>Revenue change</TableCell><TableCell className="text-right">{formatZAR(report.previous.totals.incomeCents)}</TableCell><TableCell className="text-right">{formatZAR(report.current.totals.incomeCents)}</TableCell><TableCell className="text-right">{formatZAR(profitBridge.revenueChange)}</TableCell></TableRow>
      {profitBridge.contributors.map(row => <TableRow key={row.category}><TableCell>{row.category} expense change</TableCell><TableCell className="text-right">{formatZAR(row.previousCents)}</TableCell><TableCell className="text-right">{formatZAR(row.currentCents)}</TableCell><TableCell className="text-right">{formatZAR(row.profitImpactCents)}</TableCell></TableRow>)}
      <TableRow className="font-semibold"><TableCell colSpan={3}>Reconciled profit change</TableCell><TableCell className="text-right">{formatZAR(profitBridge.profitChange)}</TableCell></TableRow>
    </TableBody></Table>
  </section>;
}
