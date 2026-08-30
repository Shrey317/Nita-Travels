import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthCategory {
  score: number;
  max: number;
}

interface VehicleHealthCardProps {
  score: number;
  reasons: string[];
  categories: {
    service: HealthCategory;
    insurance: HealthCategory;
    mileage: HealthCategory;
    repairs: HealthCategory;
    financial: HealthCategory;
  };
}

function CategoryBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  const isLow = percentage < 50;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(isLow ? "text-status-error" : "text-status-success")}>{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full", isLow ? "bg-status-error" : "bg-status-success")} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function VehicleHealthCard({ score, reasons, categories }: VehicleHealthCardProps) {
  const isHealthy = score >= 80;
  const isWarning = score >= 50 && score < 80;
  const isCritical = score < 50;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Vehicle Health
        </h3>
      </div>
      
      <div className="p-6 pt-0">
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-sm shrink-0",
            isHealthy && "border-status-success/30 bg-status-success/10 text-status-success",
            isWarning && "border-status-warning/30 bg-status-warning/10 text-status-warning",
            isCritical && "border-status-error/30 bg-status-error/10 text-status-error"
          )}>
            <span className="text-2xl font-bold">{score}</span>
          </div>
          
          <div className="flex-1">
            <h4 className={cn(
              "text-lg font-bold mb-1",
              isHealthy && "text-status-success",
              isWarning && "text-status-warning",
              isCritical && "text-status-error"
            )}>
              {isHealthy && "Excellent Condition"}
              {isWarning && "Needs Attention"}
              {isCritical && "Critical Condition"}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {reasons.length === 0 ? "All systems normal. Operating at peak efficiency." : "Issues detected affecting vehicle performance or compliance."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
          <CategoryBar label="Service" value={categories.service.score} max={categories.service.max} />
          <CategoryBar label="Insurance" value={categories.insurance.score} max={categories.insurance.max} />
          <CategoryBar label="Mileage" value={categories.mileage.score} max={categories.mileage.max} />
          <CategoryBar label="Repairs" value={categories.repairs.score} max={categories.repairs.max} />
          <CategoryBar label="Financial" value={categories.financial.score} max={categories.financial.max} />
        </div>

        {reasons.length > 0 && (
          <div className="bg-secondary/50 rounded-md p-3">
            <h4 className="text-xs font-semibold mb-2 uppercase text-muted-foreground tracking-wider">Deductions</h4>
            <ul className="space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-status-error mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
