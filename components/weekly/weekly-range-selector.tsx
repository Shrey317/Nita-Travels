"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function WeeklyRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentRange = searchParams.get("range") || "52";

  const handleRangeChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="range-selector" className="text-sm font-medium">Select Range:</Label>
      <Select value={currentRange} onValueChange={handleRangeChange}>
        <SelectTrigger id="range-selector" className="w-[180px] bg-background">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="12">Last 12 weeks</SelectItem>
          <SelectItem value="26">Last 26 weeks</SelectItem>
          <SelectItem value="52">Last 52 weeks</SelectItem>
          <SelectItem value="current-year">Current Year</SelectItem>
          <SelectItem value="prev-year">Previous Year</SelectItem>
          <SelectItem value="all">Full History</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
