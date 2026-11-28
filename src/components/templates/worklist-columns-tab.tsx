"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDemoStore } from "@/lib/store/demo-store";
import { saveWorklistColumnsToSupabase } from "@/lib/supabase/templates-sync";
import { allFields, DEFAULT_WORKLIST_COLUMNS, isManualMapping, uidShort } from "@/lib/templates";
import type { WorklistColumn } from "@/lib/types";

const MAX_COLUMNS = 20;

const FIXED_COLUMNS = [
  { name: "Patient Name", note: "pinned left" },
  { name: "Claim No", note: "pinned left" },
  { name: "Denial Code", note: "picked inside the app" },
  { name: "Comment", note: "latest note on the claim" },
  { name: "Action", note: "edited in the table" },
  { name: "Submission Status", note: "First / Second / Third" },
  { name: "Date", note: "last time the team worked it" },
  { name: "AR Level 1 & AR Level 2", note: "who uploaded / worked the claim" },
  { name: "Transaction By", note: "from the paid file" },
  { name: "Date/Time Stamp", note: "record created timestamp" },
  { name: "Actions", note: "edit icon, pinned right" },
];

export function WorklistColumnsTab({ isAdmin }: { isAdmin: boolean }) {
  const saved = useDemoStore((s) => s.worklistColumns);
  const softwares = useDemoStore((s) => s.softwares);
  const customFields = useDemoStore((s) => s.customFields);
  const setWorklistColumns = useDemoStore((s) => s.setWorklistColumns);

  const [columns, setColumns] = useState<WorklistColumn[]>(saved);
  const [newLabel, setNewLabel] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const readOnly = !isAdmin;

  // Fields actively mapped to a template field (not "Manual data input") cannot be deleted.
  const mappedFields = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const sw of softwares) {
      for (const col of sw.columns) {
        if (!col.field || isManualMapping(col)) continue;
        const list = map.get(col.field) ?? [];
        if (!list.includes(sw.name)) list.push(sw.name);
        map.set(col.field, list);
      }
    }
    return map;
  }, [softwares]);

  const dirty = JSON.stringify(columns) !== JSON.stringify(saved);
  const problems = columns.some((c) => !c.label.trim());

  const patch = (id: string, p: Partial<WorklistColumn>) => {
    const next = columns.map((c) => (c.id === id ? { ...c, ...p } : c));
    setColumns(next);
    if (next.every((c) => c.label.trim())) {
      setWorklistColumns(next);
      void saveWorklistColumnsToSupabase(next);
    }
  };

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return setAddError("Enter a column name.");
    if (columns.some((c) => c.label.trim().toLowerCase() === label.toLowerCase())) {
      return setAddError(`"${label}" already exists.`);
    }
    if (columns.length >= MAX_COLUMNS) return setAddError(`Maximum ${MAX_COLUMNS} columns allowed.`);

    const matchedField = allFields(customFields).find((f) => f.label.toLowerCase() === label.toLowerCase());
    const fieldKey = matchedField?.key ?? uidShort("wf");
    const next = [...columns, { id: uidShort("wc"), label, field: fieldKey, visible: true }];
    setColumns(next);
    setWorklistColumns(next);
    void saveWorklistColumnsToSupabase(next);
    setNewLabel("");
    setAddError(null);
    toast.success(`Added "${label}" column — now available in Field Mapping`);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="gap-0 py-0">
        <div className="space-y-1 border-b p-5">
          <h2 className="text-sm font-bold">Worklist columns</h2>
          <p className="text-[13px] text-muted-foreground">
            Name each column shown on the Worklist between Claim No and Denial Code. Every column here is automatically available in Field Mapping.
          </p>
        </div>

        {!readOnly && (
          <form onSubmit={handleAddColumn} noValidate className="flex flex-wrap items-end gap-3 border-b bg-muted/30 p-5">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="wc-new-label">Column name</Label>
              <Input
                id="wc-new-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Facility"
                aria-invalid={!!addError}
                className="bg-card"
              />
            </div>
            <Button type="submit" disabled={columns.length >= MAX_COLUMNS}>
              <Plus aria-hidden /> Add worklist column
            </Button>
            {addError && (
              <p role="alert" className="w-full text-sm text-destructive">
                {addError}
              </p>
            )}
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-4 py-2 text-left font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Column name</th>
                {!readOnly && <th className="w-16 px-3 py-2 text-right font-semibold">Delete</th>}
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => {
                const usedIn = mappedFields.get(c.field) ?? [];
                const inUse = usedIn.length > 0;
                return (
                  <tr key={c.id} className="border-t align-middle">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Worklist column ${i + 1} name`}
                        value={c.label}
                        onChange={(e) => patch(c.id, { label: e.target.value })}
                        disabled={readOnly}
                        className="h-9 bg-card"
                      />
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-2 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove worklist column ${i + 1}`}
                                disabled={inUse}
                                className={inUse ? "opacity-40" : "hover:text-destructive"}
                                onClick={() => {
                                  const next = columns.filter((x) => x.id !== c.id);
                                  setColumns(next);
                                  setWorklistColumns(next);
                                  void saveWorklistColumnsToSupabase(next);
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {inUse
                              ? `Used in Field Mapping (${usedIn.join(", ")}) — cannot delete`
                              : "Delete unused column"}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                );
              })}
              {columns.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No data columns. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setColumns(DEFAULT_WORKLIST_COLUMNS);
                setWorklistColumns(DEFAULT_WORKLIST_COLUMNS);
                void saveWorklistColumnsToSupabase(DEFAULT_WORKLIST_COLUMNS);
                toast.info("Reset to default columns");
              }}
            >
              <RotateCcw aria-hidden /> Reset to defaults
            </Button>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" disabled={!dirty} onClick={() => setColumns(saved)}>
                Discard
              </Button>
              <Button
                type="button"
                disabled={!dirty || problems}
                onClick={() => {
                  setWorklistColumns(columns);
                  void saveWorklistColumnsToSupabase(columns);
                  toast.success("Worklist columns saved");
                }}
              >
                Save columns
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="gap-3 p-5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Lock className="size-4 text-muted-foreground" aria-hidden /> Always on the worklist
        </div>
        <p className="text-[13px] text-muted-foreground">
          These workflow columns are built in and stay pinned around your data columns.
        </p>
        <ul className="space-y-1.5 text-sm">
          {FIXED_COLUMNS.map((c) => (
            <li key={c.name} className="flex items-baseline justify-between gap-2 border-t pt-1.5 first:border-t-0 first:pt-0">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.note}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
