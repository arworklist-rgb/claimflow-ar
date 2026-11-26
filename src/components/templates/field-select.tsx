"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemoStore } from "@/lib/store/demo-store";
import { BUILT_IN_FIELDS } from "@/lib/templates";
import type { CustomField, FieldType } from "@/lib/types";

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "days", label: "Days (Number)" },
  { value: "currency", label: "Currency ($)" },
];

interface FieldSelectProps {
  value: string;
  onChange: (field: string) => void;
  customFields: CustomField[];
  disabled?: boolean;
  "aria-label": string;
  className?: string;
}

const ADD_NEW_SENTINEL = "__add_new_field__";

/** Dropdown of every built-in and custom field, with an inline "+ Add new field..." option. */
export function FieldSelect({ value, onChange, customFields, disabled, className, ...rest }: FieldSelectProps) {
  const addCustomField = useDemoStore((s) => s.addCustomField);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");

  function handleSelect(next: string) {
    if (next === ADD_NEW_SENTINEL) {
      setAdding(true);
      return;
    }
    onChange(next);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    const created = addCustomField(trimmed, type);
    onChange(created.key);
    toast.success(`Added field "${created.label}"`);
    setLabel("");
    setType("text");
    setAdding(false);
  }

  return (
    <>
      <Select value={value} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger aria-label={rest["aria-label"]} className={className ?? "w-full bg-card"}>
          <SelectValue placeholder="Choose field" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {!disabled && (
            <>
              <SelectItem value={ADD_NEW_SENTINEL} className="font-semibold text-primary">
                <span className="inline-flex items-center gap-1.5">
                  <Plus className="size-3.5" aria-hidden /> Add new field...
                </span>
              </SelectItem>
              <SelectSeparator />
            </>
          )}
          <SelectGroup>
            <SelectLabel>Fields</SelectLabel>
            {BUILT_IN_FIELDS.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label}
              </SelectItem>
            ))}
          </SelectGroup>
          {customFields.length > 0 && (
            <SelectGroup>
              <SelectLabel>Custom fields</SelectLabel>
              {customFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add New Template Field</DialogTitle>
              <DialogDescription>Create a custom field and map it immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="quick-field-label">Field Name</Label>
              <Input
                id="quick-field-label"
                required
                autoFocus
                placeholder="e.g. Prior Auth #"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
