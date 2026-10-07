"use client";

import { Card } from "@/components/ui/card";
import { Car, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ClientOnlyChart } from "@/components/shared/client-only-chart";
import { chartTooltipStyle } from "@/components/shared/chart-style";
import type { Vehicle } from "@prisma/client";

export function FleetStatus({ 
  total, active, attention, inactive, recentVehicles 
}: { 
  total: number; 
  active: number; 
  attention: number; 
  inactive: number;
  recentVehicles: Vehicle[];
}) {
  const data = [
    { name: "Active", value: active, color: "#18C98B" },
    { name: "Attention Required", value: attention, color: "#F5B942" },
    { name: "Inactive", value: inactive, color: "#728199" },
  ].filter(d => d.value > 0);

  return (
    <Card className="col-span-1 flex flex-col h-full bg-card border-border-subtle shadow-card-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle p-5 bg-gradient-to-r from-surface-elevated/50 to-transparent">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-bright-blue" />
          <h2 className="text-base font-semibold text-white tracking-tight">Fleet Status</h2>
        </div>
        <Link href="/vehicles" className="text-xs font-medium text-primary hover:text-primary-hover">View all →</Link>
      </div>

      <div className="p-6 flex items-center justify-center gap-8 border-b border-border-subtle bg-surface-elevated/20">
        <div className="relative h-32 w-32 shrink-0">
          <ClientOnlyChart className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{...chartTooltipStyle, padding: "8px 12px"}}
                  itemStyle={{color: "#F8FAFC", fontSize: "13px"}}
                  formatter={(value: number) => [value, "Vehicles"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ClientOnlyChart>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-white">{total}</span>
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Total</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-ink-secondary">{d.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-white">{d.value}</span>
                <span className="text-muted text-xs w-8 text-right">{((d.value / total) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-0 flex flex-col">
        <div className="px-5 py-3 border-b border-border-subtle bg-surface-elevated/30">
          <h3 className="text-sm font-semibold text-white">Recent Vehicles</h3>
        </div>
        <div className="flex-1 flex flex-col divide-y divide-border-subtle overflow-y-auto max-h-[220px]">
          {recentVehicles.slice(0, 4).map(v => (
            <Link key={v.id} href={`/vehicles/${v.id}`} className="group flex items-center justify-between px-5 py-3 hover:bg-surface-elevated/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border-subtle group-hover:border-primary/30 transition-colors">
                  <Car className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{v.id}</span>
                  <span className="text-xs text-muted">{v.make} {v.model}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${v.active ? 'bg-status-success/10 text-status-success' : 'bg-surface text-muted border border-border-subtle'}`}>
                  {v.active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs font-mono-figures text-ink-secondary w-16 text-right">{v.currentMileageKm.toLocaleString()} km</span>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          {recentVehicles.length === 0 && (
            <div className="p-6 text-center text-sm text-muted">No vehicles found.</div>
          )}
        </div>
      </div>
    </Card>
  );
}
