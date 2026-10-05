import { ReactNode } from "react";

export function FeatureItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A1930]/80 border border-[#2563EB]/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]">
        {icon}
      </div>
      <span className="text-sm font-medium text-[#F8FAFC]">{label}</span>
    </div>
  );
}
