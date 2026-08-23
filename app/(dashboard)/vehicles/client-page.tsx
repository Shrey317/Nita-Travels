"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, LayoutGrid, List, MoreVertical, Edit, Activity, PowerOff } from "lucide-react";
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

interface VehicleListClientProps {
  initialVehicles: VehicleSummary[];
}

export function VehicleListClient({ initialVehicles }: VehicleListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Vehicles</h1>
          <p className="text-sm text-muted">{filteredVehicles.length} vehicles matching filters</p>
        </div>
        <Button asChild className="bg-brand-blue text-white hover:bg-brand-blueAccent">
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex flex-1 items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-transparent pl-9 pr-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 border-border bg-transparent">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[140px] h-9 border-border bg-transparent">
              <SelectValue placeholder="All Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Service</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due">Due Soon</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-md border border-border p-1 bg-surface">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-card shadow-sm text-ink" : "text-muted hover:text-ink"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-card shadow-sm text-ink" : "text-muted hover:text-ink"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted">No vehicles match your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((v) => (
            <VehicleCard key={v.vehicle.id} {...v} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Registration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Mileage</th>
                <th className="px-4 py-3 font-medium text-right">Net P/L</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVehicles.map((v) => {
                const isProfit = v.netProfitCents > 0;
                return (
                  <tr key={v.vehicle.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-ink">{v.vehicle.id}</td>
                    <td className="px-4 py-3">
                      <Link href={`/vehicles/${v.vehicle.id}`} className="font-semibold text-teal hover:underline">
                        {v.vehicle.make} {v.vehicle.model}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{v.vehicle.registration}</td>
                    <td className="px-4 py-3">
                      <Badge variant={v.vehicle.active ? "success" : "secondary"}>
                        {v.vehicle.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {v.service ? (
                        <Badge variant={badgeVariant[v.service.status]}>{badgeLabel[v.service.status]}</Badge>
                      ) : (
                        <span className="text-muted text-xs">No Data</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatKm(v.vehicle.currentMileageKm)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${isProfit ? "text-status-green" : "text-status-red"}`}>
                      {formatZAR(v.netProfitCents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1 flex flex-col gap-1">
                          <Button variant="ghost" asChild className="justify-start font-normal h-9">
                            <Link href={`/vehicles/${v.vehicle.id}`}>
                              <Activity className="mr-2 h-4 w-4 text-muted" />
                              View Profile
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start font-normal h-9">
                            <Link href={`/vehicles/${v.vehicle.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4 text-muted" />
                              Edit Details
                            </Link>
                          </Button>
                          <Button variant="ghost" className="justify-start font-normal h-9 text-status-red hover:text-status-red hover:bg-status-red/10">
                            <PowerOff className="mr-2 h-4 w-4" />
                            {v.vehicle.active ? "Deactivate" : "Activate"}
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
