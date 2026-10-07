"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, LayoutGrid, List, MoreVertical, Edit, Activity, Car } from "lucide-react";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatZAR, formatKm } from "@/lib/format";
import { badgeLabel, badgeVariant } from "@/lib/service";
import type { VehicleSummary } from "@/lib/db/vehicles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";

interface VehicleListClientProps {
  initialVehicles: VehicleSummary[];
}

export function VehicleListClient({ initialVehicles }: VehicleListClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [serviceFilter, setServiceFilter] = useState(searchParams.get("service") ?? "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredVehicles = initialVehicles.filter((v) => {
    if (search) {
      const s = search.toLowerCase();
      if (!v.vehicle.make.toLowerCase().includes(s) &&
          !v.vehicle.model.toLowerCase().includes(s) &&
          !v.vehicle.registration.toLowerCase().includes(s) &&
          !v.vehicle.id.toLowerCase().includes(s)) {
        return false;
      }
    }
    if (statusFilter === "active" && !v.vehicle.active) return false;
    if (statusFilter === "inactive" && v.vehicle.active) return false;
    
    if (serviceFilter === "overdue" && v.service?.status !== "OVERDUE") return false;
    if (serviceFilter === "due" && v.service?.status !== "DUE_SOON") return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description={`${filteredVehicles.length} vehicles matching filters`}>
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border-subtle bg-card p-4 shadow-card-elevated">
        <div className="flex flex-1 items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              aria-label="Search vehicles"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-elevated pl-9 pr-4 text-sm text-white placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Vehicle status" className="w-[130px] h-10 border-border-subtle bg-surface-elevated text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger aria-label="Service status" className="w-[140px] h-10 border-border-subtle bg-surface-elevated text-white">
              <SelectValue placeholder="All Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Service</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due">Due Soon</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-lg border border-border-subtle p-1 bg-surface-elevated">
            <button 
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary shadow-sm" : "text-muted hover:text-white"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary shadow-sm" : "text-muted hover:text-white"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle bg-card p-12 text-center">
          <Car className="h-8 w-8 text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-ink-secondary">No vehicles match your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((v) => (
            <VehicleCard key={v.vehicle.id} {...v} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-card overflow-x-auto shadow-card-elevated">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-elevated/50 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Registration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Service</th>
                <th className="px-5 py-3.5">Mileage</th>
                <th className="px-5 py-3.5 text-right">Net P/L</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredVehicles.map((v) => {
                const isProfit = v.netProfitCents >= 0;
                return (
                  <tr key={v.vehicle.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{v.vehicle.id}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/vehicles/${v.vehicle.id}`} className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
                        {v.vehicle.make} {v.vehicle.model}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-secondary">{v.vehicle.registration}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={v.vehicle.active ? "success" : "secondary"}>
                        {v.vehicle.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {v.service ? (
                        <Badge variant={badgeVariant[v.service.status]}>{badgeLabel[v.service.status]}</Badge>
                      ) : (
                        <span className="text-muted text-xs">No Data</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono-figures text-ink-secondary">{formatKm(v.vehicle.currentMileageKm)}</td>
                    <td className={`px-5 py-3.5 text-right font-mono-figures font-semibold ${isProfit ? "text-status-success" : "text-error"}`}>
                      {formatZAR(v.netProfitCents)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${v.vehicle.id}`} className="h-8 w-8 text-muted hover:text-white hover:bg-surface-elevated">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1 flex flex-col gap-1 bg-card border-border-subtle">
                          <Button variant="ghost" asChild className="justify-start font-normal h-9 text-ink-secondary hover:text-white">
                            <Link href={`/vehicles/${v.vehicle.id}`}>
                              <Activity className="mr-2 h-4 w-4 text-muted" />
                              View Profile
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start font-normal h-9 text-ink-secondary hover:text-white">
                            <Link href={`/vehicles/${v.vehicle.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4 text-muted" />
                              Edit Details
                            </Link>
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
