import { AlertTriangle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleReplacementCardProps {
  recommended: boolean;
  reasons: string[];
}

export function VehicleReplacementCard({ recommended, reasons }: VehicleReplacementCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-full",
      recommended && "border-status-warning/30"
    )}>
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
          {recommended ? (
            <AlertTriangle className="h-4 w-4 text-status-warning" />
          ) : (
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          )}
          Replacement Analysis
        </h3>
      </div>
      
      <div className="p-6 pt-0 flex-1 flex flex-col">
        {recommended ? (
          <>
            <div className="bg-status-warning/10 text-status-warning p-3 rounded-md mb-4 text-sm font-medium">
              Replacement Recommended
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This vehicle has met multiple criteria suggesting it may no longer be economically viable to operate. Consider phasing it out of the active fleet.
            </p>
            <div className="mt-auto">
              <h4 className="text-xs font-semibold mb-2 uppercase text-muted-foreground tracking-wider">Triggered Criteria</h4>
              <ul className="space-y-2">
                {reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                    <span className="text-status-warning mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full py-6 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <p className="font-medium text-foreground mb-1">Asset Viable</p>
            <p className="text-sm px-4">
              This vehicle is currently operating within acceptable economic and mechanical parameters. No replacement necessary at this time.
            </p>
            {reasons.length > 0 && (
              <div className="mt-6 w-full text-left">
                <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider">Early Warning Signs</h4>
                <ul className="space-y-1">
                  {reasons.map((reason, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-status-warning mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
