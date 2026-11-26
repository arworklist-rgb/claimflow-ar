"use client";

import { useState } from "react";
import { Lock, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/lib/store/demo-store";
import { DEFAULT_WORKLIST_COLUMNS, fieldDef, uidShort } from "@/lib/templates";
import type { WorklistColumn } from "@/lib/types";
import { FieldSelect } from "./field-select";
import { TemplateHeaderSelect } from "./template-header-select";

const MAX_COLUMNS = 20;

/** Columns the worklist always has, whatever is configured here (the blue block in the client's sheet). */
const FIXED_COLUMNS = [
  { name: "Patient Name", note: "pinned left" },
  { name: "Claim No", note: "pinned left" },
  { name: "Denial Code", note: "picked inside the app" },
  { name: "Comment", note: "latest note on the claim" },
  { name: "Action", note: "edited in the table" },
  { name: "Submission Status", note: "First / Second / Third" },
  { name: "Date", note: "last time the team worked it" },
  { name: "AR / Team", note: "who uploaded the claim" },
  { name: "Transaction By", note: "from the paid file" },
  { name: "Actions", note: "edit icon, pinned right" },
];

export function WorklistColumnsTab({ isAdmin }: { isAdmin: boolean }) {
  const saved = useDemoStore((s) => s.worklistColumns);
  const customFields = useDemoStore((s) => s.customFields);
  const setWorklistColumns = useDemoStore((s) => s.setWorklistColumns);
  const [columns, setColumns] = useState<WorklistColumn[]>(saved);
  const readOnly = !isAdmin;

  const dirty = JSON.stringify(columns) !== JSON.stringify(saved);
  const patch = (id: string, p: Partial<WorklistColumn>) => setColumns((list) => list.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const problems = columns.some((c) => !c.label.trim() || !fieldDef(c.field, customFields));

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="gap-0 py-0">
        <div className="space-y-1 border-b p-5">
          <h2 className="text-sm font-bold">Worklist columns</h2>
          <p className="text-[13px] text-muted-foreground">
            Name each column and choose the template field it shows. They appear on the Worklist in this order, between Claim No and Denial Code.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-4 py-2 text-left font-semibold">#</th>
                <th className="px-2 py-2 text-left font-semibold">Column name</th>
                <th className="w-56 px-2 py-2 text-left font-semibold">Shows field</th>
                {!readOnly && <th className="w-16 px-3 py-2 text-right font-semibold">Delete</th>}
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => (
                <tr key={c.id} className="border-t align-middle">
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-2 py-2">
                    <TemplateHeaderSelect
                      aria-label={`Worklist column ${i + 1} name`}
                      value={c.label}
                      onChange={(label) => patch(c.id, { label })}
                      customFields={customFields}
                      extraOptions={columns.map((col) => col.label)}
                      disabled={readOnly}
                      className="h-9 w-full bg-card"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <FieldSelect aria-label={`Worklist column ${i + 1} shows`} value={c.field} onChange={(field) => patch(c.id, { field })} customFields={customFields} disabled={readOnly} className="h-9 w-full bg-card" />
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove worklist column ${i + 1}`}
                        className="hover:text-destructive"
                        onClick={() => setColumns((list) => list.filter((x) => x.id !== c.id))}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {columns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No data columns. Add one below.
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
              variant="outline"
              size="sm"
              disabled={columns.length >= MAX_COLUMNS}
              onClick={() => setColumns((list) => [...list, { id: uidShort("wc"), label: "New column", field: "", visible: true }])}
            >
              <Plus aria-hidden /> Add worklist column
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setColumns(structuredClone(DEFAULT_WORKLIST_COLUMNS))}>
              <RotateCcw aria-hidden /> Reset to defaults
            </Button>
            {problems && <span className="text-sm text-amber-700 dark:text-amber-400">Every column needs a name and a field.</span>}
          </div>
        )}

        {!readOnly && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-5 py-3.5">
            {dirty && <span className="mr-auto text-sm text-muted-foreground">Unsaved changes</span>}
            <Button variant="outline" disabled={!dirty} onClick={() => setColumns(saved)}>
              Discard
            </Button>
            <Button
              disabled={!dirty || problems}
              onClick={() => {
                setWorklistColumns(columns.map((c) => ({ ...c, label: c.label.trim() })));
                toast.success("Worklist columns saved");
              }}
            >
              Save columns
            </Button>
          </div>
        )}
      </Card>

      <Card className="gap-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Lock className="size-3.5 text-muted-foreground" aria-hidden /> Always on the worklist
        </h3>
        <ul className="space-y-2 text-sm">
          {FIXED_COLUMNS.map((f) => (
            <li key={f.name} className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{f.name}</span>
              <span className="text-right text-xs text-muted-foreground">{f.note}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
