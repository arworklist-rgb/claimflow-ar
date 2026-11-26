"use client";

import { useState } from "react";
import { CircleCheck, ChevronDown, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { summarizePaidResults, type PaidRowResult } from "@/lib/claims";
import { normalizeDate } from "@/lib/dates";
import { formatCurrency, formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaidResultProps {
  fileName: string;
  results: PaidRowResult[];
  onDismiss: () => void;
}

/** What a paid-claims upload did: one summary line, plus the rows that didn't update anything. */
export function PaidResult({ fileName, results, onDismiss }: PaidResultProps) {
  const [open, setOpen] = useState(false);
  const { updated, notFound, multiple, alreadyPaid } = summarizePaidResults(results);
  const issues = results.filter((r) => r.outcome !== "updated");

  const parts = [
    { n: updated, text: "updated to Paid and closed", tone: "text-success" },
    { n: notFound, text: "not found" },
    { n: multiple, text: "multiple matches", tone: "text-amber-700 dark:text-amber-400" },
    { n: alreadyPaid, text: "already paid and closed" },
  ];

  return (
    <section
      aria-label="Paid claims upload result"
      className="space-y-3 rounded-xl border border-success/30 bg-success-soft/60 p-4 dark:bg-success-soft/30"
    >
      <div className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" data-testid="paid-result-summary">
            {parts.map((p, i) => (
              <span key={p.text}>
                {i > 0 && <span className="text-muted-foreground"> · </span>}
                <span className={cn("tabular-nums", p.n > 0 && p.tone)}>{p.n}</span> {p.text}
              </span>
            ))}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={fileName}>
            {fileName} · {results.length} {pluralize(results.length, "row")} checked
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss result"
          className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {issues.length > 0 && (
        <div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="paid-result-details"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded text-xs font-semibold text-foreground/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
            {open ? "Hide" : "Show"} {issues.length} {pluralize(issues.length, "row")} that didn&apos;t update
          </button>
          {open && (
            <div id="paid-result-details" className="mt-2 overflow-x-auto rounded-lg border bg-card">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    {["Row", "Patient name", "Acct no", "Service date", "Paid amount", "Reason"].map((h) => (
                      <TableHead key={h} className="h-9 text-xs font-semibold whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map(({ row, reason }) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="py-2 tabular-nums">{row.rowNumber}</TableCell>
                      <TableCell className="py-2 font-medium whitespace-nowrap">{row.patientName || "—"}</TableCell>
                      <TableCell className="py-2 font-mono text-[11px]">{row.acctNo || "—"}</TableCell>
                      <TableCell className="py-2 whitespace-nowrap">{row.serviceDate ? formatDate(normalizeDate(row.serviceDate)) : "—"}</TableCell>
                      <TableCell className="py-2 tabular-nums">{formatCurrency(row.paidAmount)}</TableCell>
                      <TableCell className="py-2 whitespace-nowrap">{reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
