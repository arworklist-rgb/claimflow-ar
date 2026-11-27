"use client";

import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { WorklistColumn } from "@/lib/types";

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

interface WorklistColumnsTabProps {
  columns: WorklistColumn[];
  onChangeColumns: (cols: WorklistColumn[]) => void;
  isAdmin: boolean;
}

export function WorklistColumnsTab({ columns, onChangeColumns, isAdmin }: WorklistColumnsTabProps) {
  const readOnly = !isAdmin;

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= columns.length) return;
    const copy = [...columns];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChangeColumns(copy);
  };

  const toggleDisplay = (id: string, visible: boolean) => {
    onChangeColumns(columns.map((c) => (c.id === id ? { ...c, visible } : c)));
  };

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="gap-0 py-0">
        <div className="space-y-1 border-b p-5">
          <h2 className="text-sm font-bold">Worklist columns</h2>
          <p className="text-[13px] text-muted-foreground">
            Control which mapped fields are displayed on the Worklist and in what order (between Claim No and Denial Code).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-12 px-4 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Column name</th>
                <th className="w-36 px-3 py-2 text-left font-semibold">Order &amp; Display</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => (
                <tr key={c.id} className="border-t align-middle">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{c.label}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${c.label} up`}
                        disabled={readOnly || i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Move ${c.label} down`}
                        disabled={readOnly || i === columns.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Switch
                        aria-label={`Display ${c.label} on worklist`}
                        checked={c.visible}
                        disabled={readOnly}
                        onCheckedChange={(on) => toggleDisplay(c.id, on)}
                        className="ml-1.5"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {columns.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No columns mapped for this software yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
