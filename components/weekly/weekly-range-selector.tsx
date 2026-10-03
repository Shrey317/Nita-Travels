"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { businessToday, dateKey } from "@/lib/date-ranges";

export function WeeklyRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get("range") || "52";

  const handleRangeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", val);
    if (val === "custom") {
      params.set("dateFrom", params.get("dateFrom") ?? dateKey(businessToday()));
      params.set("dateTo", params.get("dateTo") ?? dateKey(businessToday()));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor="range-selector" className="text-sm font-medium">Select Range:</Label>
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger id="range-selector" className="w-[180px] bg-card">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="12">Last 12 weeks</SelectItem>
          <SelectItem value="26">Last 26 weeks</SelectItem>
          <SelectItem value="52">Last 52 weeks</SelectItem>
          <SelectItem value="current-year">Current Year</SelectItem>
          <SelectItem value="prev-year">Previous Year</SelectItem>
          <SelectItem value="all">Full History</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
