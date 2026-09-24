"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface YearSelectorProps {
  availableYears: number[];
  selectedYear: number;
}

export function YearSelector({ availableYears, selectedYear }: YearSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleYearChange = (yearStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", yearStr);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2 mb-6">
      <Label htmlFor="year-selector" className="text-sm font-medium">Select Year:</Label>
      <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger id="year-selector" className="w-[120px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
