"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pluralize } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { allFields, BUILT_IN_FIELDS, FIELD_TYPE_LABELS } from "@/lib/templates";
import type { CustomField, FieldType } from "@/lib/types";

const TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[];

export function CustomFieldsTab({ isAdmin }: { isAdmin: boolean }) {
  const customFields = useDemoStore((s) => s.customFields);
  const softwares = useDemoStore((s) => s.softwares);
  const worklistColumns = useDemoStore((s) => s.worklistColumns);
  const claims = useDemoStore((s) => s.claims);
  const addCustomField = useDemoStore((s) => s.addCustomField);
  const updateCustomField = useDemoStore((s) => s.updateCustomField);

  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("text");
  const [error, setError] = useState<string | null>(null);

  const usage = (f: CustomField) => ({
    templates: softwares.reduce((n, s) => n + s.columns.filter((c) => c.field === f.key).length, 0),
    columns: worklistColumns.filter((c) => c.field === f.key).length,
    claims: claims.filter((c) => c.extra && f.key in c.extra).length,
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = label.trim();
    if (!name) return setError("Enter a field name.");
    if (allFields(customFields).some((f) => f.label.toLowerCase() === name.toLowerCase())) {
      return setError(`“${name}” is already a field.`);
    }
    addCustomField(name, type);
    setLabel("");
    setError(null);
    toast.success(`${name} added. Map it in a template or a worklist column.`);
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="gap-0 py-0">
        <div className="space-y-1 border-b p-5">
          <h2 className="text-sm font-bold">Template fields</h2>
          <p className="text-[13px] text-muted-foreground">
            Extra fields beyond the built-in ones. Once added, a field can be mapped from any software&apos;s template column and shown in a worklist column.
          </p>
        </div>

        {isAdmin && (
          <form onSubmit={add} noValidate className="flex flex-wrap items-end gap-3 border-b bg-muted/30 p-5">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="cf-label">Field name</Label>
              <Input
                id="cf-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Facility"
                aria-invalid={!!error}
                className="bg-card"
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <div className="w-56 space-y-1.5">
              <Label htmlFor="cf-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger id="cf-type" className="w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <Plus aria-hidden /> Add field
            </Button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-4 py-2 text-left font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Field name</th>
                <th className="w-56 px-2 py-2 text-left font-semibold">Type</th>
                <th className="px-3 py-2 text-left font-semibold">Usage</th>
              </tr>
            </thead>
            <tbody>
              {customFields.map((f, i) => {
                const u = usage(f);
                return (
                  <tr key={f.id} className="border-t align-middle">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Name of ${f.label}`}
                        defaultValue={f.label}
                        disabled={!isAdmin}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          if (next && next !== f.label) updateCustomField(f.id, { label: next, type: f.type });
                          else e.target.value = f.label;
                        }}
                        className="h-9 bg-card"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={f.type}
                        onValueChange={(v) => updateCustomField(f.id, { label: f.label, type: v as FieldType })}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger aria-label={`Type of ${f.label}`} className="h-9 w-full bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {FIELD_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {u.templates} template {pluralize(u.templates, "column")} · {u.columns} worklist {pluralize(u.columns, "column")} · {u.claims} {pluralize(u.claims, "claim")}
                    </td>
                  </tr>
                );
              })}
              {customFields.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No custom fields yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="gap-3 p-5">
        <h3 className="text-sm font-bold">Built-in fields</h3>
        <ul className="space-y-1.5 text-sm">
          {BUILT_IN_FIELDS.map((f) => (
            <li key={f.key} className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{f.label}</span>
              <span className="text-xs text-muted-foreground">{FIELD_TYPE_LABELS[f.type]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
