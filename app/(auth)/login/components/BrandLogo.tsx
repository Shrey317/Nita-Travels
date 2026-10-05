import { Navigation } from "lucide-react";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#050B18] to-[#0A1930] border border-[#2563EB]/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
        <Navigation className="h-6 w-6 text-[#3B82F6]" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">Nita Travels</h1>
        <p className="text-sm font-medium text-[#AAB7CC]">Fleet Management System</p>
      </div>
    </div>
  );
}
