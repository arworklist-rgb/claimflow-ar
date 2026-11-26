"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUILT_IN_FIELDS } from "@/lib/templates";
import type { CustomField } from "@/lib/types";

interface TemplateHeaderSelectProps {
  value: string;
  onChange: (header: string) => void;
  customFields: CustomField[];
  extraOptions?: string[];
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

const ADD_HEADER_SENTINEL = "__add_custom_header__";

const STANDARD_HEADERS = [
  "Patient Name",
  "Claim No",
  "Claim Date",
  "Service date",
  "Billed date",
  "Responsible",
  "Provider",
  "Aging",
  "Procedure",
  "Charge",
  "Balance",
  "Account",
  "Patient Acct No",
  "Paid Amount",
  "Transaction By",
];

/** Dropdown of template/column headers with an inline "+ Add custom header..." option. */
export function TemplateHeaderSelect({
  value,
  onChange,
  customFields,
  extraOptions = [],
  disabled,
  className,
  ...rest
}: TemplateHeaderSelectProps) {
  const [adding, setAdding] = useState(false);
  const [customHeader, setCustomHeader] = useState("");
  const [addedHeaders, setAddedHeaders] = useState<string[]>([]);

  const options = useMemo(() => {
    const set = new Set<string>([
      ...STANDARD_HEADERS,
      ...BUILT_IN_FIELDS.map((f) => f.label),
      ...customFields.map((f) => f.label),
      ...extraOptions.filter(Boolean),
      ...addedHeaders,
    ]);
    if (value.trim()) set.add(value.trim());
    return Array.from(set);
  }, [customFields, extraOptions, addedHeaders, value]);

  function handleSelect(next: string) {
    if (next === ADD_HEADER_SENTINEL) {
      setAdding(true);
      return;
    }
    onChange(next);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customHeader.trim();
    if (!trimmed) return;
    setAddedHeaders((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    onChange(trimmed);
    toast.success(`Added "${trimmed}"`);
    setCustomHeader("");
    setAdding(false);
  }

  return (
    <>
      <Select value={value} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger aria-label={rest["aria-label"]} className={className ?? "h-9 w-full bg-card"}>
          <SelectValue placeholder="Choose or add header" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {!disabled && (
            <>
              <SelectItem value={ADD_HEADER_SENTINEL} className="font-semibold text-primary">
                <span className="inline-flex items-center gap-1.5">
                  <Plus className="size-3.5" aria-hidden /> Add custom header...
                </span>
              </SelectItem>
              <SelectSeparator />
            </>
          )}
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

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Template Field Header</DialogTitle>
              <DialogDescription>Enter a column header name to add to the dropdown and select it.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="quick-header-name">Header Name</Label>
              <Input
                id="quick-header-name"
                required
                autoFocus
                placeholder="e.g. Secondary Payer"
                value={customHeader}
                onChange={(e) => setCustomHeader(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit">Add &amp; Select</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
