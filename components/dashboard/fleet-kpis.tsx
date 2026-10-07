import { Car, CheckCircle2, AlertTriangle, PowerOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FleetKPIsProps {
  total: number;
  active: number;
  attention: number;
  inactive: number;
}

export function FleetKPIs({ total, active, attention, inactive }: FleetKPIsProps) {
  const cards = [
    {
      label: "Total Vehicles",
      value: total,
      icon: Car,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/vehicles",
      gradient: "from-primary/20 to-transparent",
    },
    {
      label: "Active Vehicles",
      value: active,
      icon: CheckCircle2,
      color: "text-status-success",
      bg: "bg-status-success/10",
      href: "/vehicles?status=active",
      gradient: "from-status-success/20 to-transparent",
    },
    {
      label: "Attention Required",
      value: attention,
      icon: AlertTriangle,
      color: "text-status-warning",
      bg: "bg-status-warning/10",
      href: "/alerts",
      gradient: "from-status-warning/20 to-transparent",
    },
    {
      label: "Inactive Vehicles",
      value: inactive,
      icon: PowerOff,
      color: "text-muted",
      bg: "bg-surface-elevated",
      href: "/vehicles?status=inactive",
      gradient: "from-muted/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-border-subtle bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-card-hover"
        >
          {/* Subtle gradient background */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", card.gradient)} />
          
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-[10px]", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            {/* Sparkline placeholder (only decorative right now, we don't have historical counts easily accessible) */}
            <svg className="h-6 w-16 stroke-current opacity-30 transition-opacity group-hover:opacity-70" viewBox="0 0 100 30" fill="none" strokeWidth="2">
              <path d="M0,25 C20,25 30,15 50,15 C70,15 80,5 100,5" className={card.color} />
            </svg>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tight text-white">{card.value}</h3>
            <p className="mt-1 text-sm font-medium text-ink-secondary">{card.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
