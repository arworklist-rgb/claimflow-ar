"use client";

import { ArrowDown, ArrowUp, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { REQUIRED_FIELD_KEYS, uidShort } from "@/lib/templates";
import type { CustomField, Software, SoftwareColumn } from "@/lib/types";
import { FieldSelect } from "./field-select";
import { TemplateHeaderSelect } from "./template-header-select";

interface SoftwareTabProps {
  software: Software;
  columns: SoftwareColumn[];
  onChangeColumns: (cols: SoftwareColumn[]) => void;
  customFields: CustomField[];
  errors: string[];
  isAdmin: boolean;
}

export function SoftwareTab({
  software,
  columns,
  onChangeColumns,
  customFields,
  errors,
  isAdmin,
}: SoftwareTabProps) {
  const readOnly = !isAdmin;

  const patch = (id: string, p: Partial<SoftwareColumn>) =>
    onChangeColumns(columns.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const copy = [...columns];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChangeColumns(copy);
  };

  return (
    <Card className="gap-0 py-0">
      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-sm font-bold">Template columns — {software.name}</h3>
          <p className="text-[13px] text-muted-foreground">
            Map each Worklist field to its Excel Template Field header. Claim No, Patient and Service date are always required.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-3 py-2 text-left font-semibold">#</th>
                <th className="w-52 px-2 py-2 text-left font-semibold">Worklist fields</th>
                {!readOnly && <th className="w-28 px-2 py-2 text-left font-semibold">Order</th>}
                <th className="px-2 py-2 text-left font-semibold">Template Fields</th>
                <th className="px-2 py-2 text-left font-semibold">Also accepts</th>
                <th className="w-20 px-2 py-2 text-center font-semibold">Required</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => {
                const forced = (REQUIRED_FIELD_KEYS as readonly string[]).includes(c.field);
                return (
                  <tr key={c.id} className="border-t align-middle">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-2">
                      <FieldSelect
                        aria-label={`Column ${i + 1} maps to`}
                        value={c.field}
                        onChange={(field) => patch(c.id, { field })}
                        customFields={customFields}
                        disabled={readOnly}
                        className="h-9 w-full bg-card"
                      />
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-2">
                        <div className="flex justify-start gap-0.5">
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move column ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move column ${i + 1} down`} disabled={i === columns.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown />
                          </Button>
                          <Switch
                            aria-label={`Column ${i + 1} ${c.hidden ? "hidden" : "shown"} in template`}
                            checked={!c.hidden}
                            disabled={forced}
                            onCheckedChange={(on) => patch(c.id, { hidden: !on })}
                            className="mx-1.5 self-center"
                          />
                        </div>
                      </td>
                    )}
                    <td className="px-2 py-2">
                      <TemplateHeaderSelect
                        aria-label={`Column ${i + 1} name`}
                        value={c.header}
                        onChange={(header) => patch(c.id, { header })}
                        customFields={customFields}
                        extraOptions={columns.map((col) => col.header)}
                        disabled={readOnly}
                        className="h-9 w-full bg-card"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Column ${i + 1} other names`}
                        value={c.aliases.join(", ")}
                        onChange={(e) => patch(c.id, { aliases: e.target.value.split(",") })}
                        placeholder="e.g. Claim Number, Claim ID"
                        disabled={readOnly}
                        className="h-9 bg-card"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Checkbox
                        aria-label={`Column ${i + 1} required`}
                        checked={c.required || forced}
                        disabled={readOnly || forced}
                        onCheckedChange={(v) => patch(c.id, { required: v === true })}
                      />
                    </td>
                  </tr>
                );
              })}
              {columns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No columns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChangeColumns([...columns, { id: uidShort("col"), header: "", aliases: [], field: "", required: false }])
            }
          >
            <Plus aria-hidden /> Add column
          </Button>
        )}

        {errors.length > 0 && (
          <ul role="alert" aria-label="Template problems" className="space-y-1 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {errors.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
