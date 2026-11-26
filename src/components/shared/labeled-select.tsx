"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LabeledSelectProps {
  /** Prefix shown inside the trigger, e.g. "Status:". */
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  "aria-label"?: string;
}

/** Compact filter select whose trigger reads "Status: All". */
export function LabeledSelect({ label, value, onValueChange, options, className, ...rest }: LabeledSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("min-w-36 bg-card max-sm:w-full", className)} aria-label={rest["aria-label"] ?? label}>
        {label && <span className="text-muted-foreground">{label}</span>}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
