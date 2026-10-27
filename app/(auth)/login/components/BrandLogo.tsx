import { Navigation } from "lucide-react";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl border border-brand-blue/25 bg-[#0B1A33] shadow-soft">
        <Navigation className="h-7 w-7 text-brand-blueAccent" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold tracking-tight text-white">Nita Travels</p>
        <p className="mt-1 text-sm font-medium text-[#AAB7CC]">Fleet Management System</p>
      </div>
    </div>
  );
}
