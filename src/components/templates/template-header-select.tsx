"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUILT_IN_FIELDS, MANUAL_DATA_INPUT } from "@/lib/templates";
import type { CustomField } from "@/lib/types";

interface TemplateHeaderSelectProps {
  value: string;
  onChange: (header: string) => void;
  customFields: CustomField[];
  usedHeaders?: string[];
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

/** Dropdown of Template Fields only (excluding values already mapped on other rows), plus "Manual data input". */
export function TemplateHeaderSelect({
  value,
  onChange,
  customFields,
  usedHeaders = [],
  disabled,
  className,
  ...rest
}: TemplateHeaderSelectProps) {
  const options = useMemo(() => {
    const usedSet = new Set(
      usedHeaders
        .map((h) => h.trim().toLowerCase())
        .filter((h) => h && h !== MANUAL_DATA_INPUT.toLowerCase() && h !== value.trim().toLowerCase()),
    );
    const allTemplateLabels = Array.from(
      new Set([...BUILT_IN_FIELDS.map((f) => f.label), ...customFields.map((f) => f.label)]),
    );
    return allTemplateLabels.filter((label) => !usedSet.has(label.toLowerCase()));
  }, [customFields, usedHeaders, value]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={rest["aria-label"]} className={className ?? "h-9 w-full bg-card"}>
        <SelectValue placeholder={MANUAL_DATA_INPUT} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={MANUAL_DATA_INPUT}>{MANUAL_DATA_INPUT}</SelectItem>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Template Fields</SelectLabel>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
