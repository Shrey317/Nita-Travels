"use client";

import { ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** Radix's Select is single-select by design, so filter bars needing true multi-select (SRS
 *  15.4: vehicle and category filters) use this Popover + Checkbox combination instead. */
export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const summary =
    selected.length === 0
      ? "Any"
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 justify-between font-normal">
          <span className="truncate">
            {label}: {summary}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 overflow-y-auto">
        <div className="space-y-2" role="group" aria-label={label}>
          {options.map((opt) => {
            const id = `multiselect-${label}-${opt.value}`;
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox id={id} checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                  {opt.label}
                </Label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
