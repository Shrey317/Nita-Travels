import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VehicleReplacementCardProps {
  recommended: boolean;
  reasons: string[];
}

export function VehicleReplacementCard({ recommended, reasons }: VehicleReplacementCardProps) {
  return (
    <Card className={cn("flex flex-col h-full", recommended && "border-status-warning/30")}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted">
          {recommended ? (
            <AlertTriangle className="h-4 w-4 text-status-warning" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          )}
          Replacement Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {recommended ? (
          <>
            <div className="bg-status-warning-bg text-status-warning p-3 rounded-lg mb-4 text-sm font-medium">
              Replacement Review Factors Detected
            </div>
            <p className="text-sm text-muted mb-4">
              Multiple recorded factors meet the existing review thresholds. Review the figures, financing and maintenance history before making a replacement decision.
            </p>
            <div className="mt-auto">
              <h4 className="text-xs font-semibold mb-2 uppercase text-muted tracking-wider">Triggered Criteria</h4>
              <ul className="space-y-2">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-ink-secondary flex items-start gap-2">
                    <span className="text-status-warning mt-0.5 shrink-0">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full py-6">
            <div className="h-12 w-12 rounded-full bg-status-success-bg flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-status-success" aria-hidden="true" />
            </div>
            <p className="font-medium text-ink mb-1">Review threshold not reached</p>
            <p className="text-sm text-muted px-4">
              The recorded factors do not meet the current review threshold. This is not an assessment of mechanical condition or a replacement decision.
            </p>
            {reasons.length > 0 && (
              <div className="mt-6 w-full text-left">
                <h4 className="text-xs font-semibold mb-2 uppercase text-muted tracking-wider">Early Warning Signs</h4>
                <ul className="space-y-1">
                  {reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-ink-secondary flex items-start gap-2">
                      <span className="text-status-warning mt-0.5 shrink-0">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
