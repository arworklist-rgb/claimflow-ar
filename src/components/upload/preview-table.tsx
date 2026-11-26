import { TriangleAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { normalizeDate, parseAmount } from "@/lib/excel/parse";
import type { FieldType } from "@/lib/types";
import { cn } from "@/lib/utils";

const AMOUNT_COLUMNS = new Set(["Charge", "Balance", "Paid Amount"]);
const DATE_COLUMNS = new Set(["Claim Date", "Service date", "Billed date", "Payment Date"]);
const MONO_COLUMNS = new Set(["Claim No", "Procedure", "Patient Acct No"]);

interface PreviewTableProps {
  expected: readonly string[];
  missing: string[];
  rows: Record<string, string>[];
  limit?: number;
  /** Column -> how to show its values. Overrides the built-in column-name lists (used for software templates). */
  columnTypes?: Record<string, FieldType>;
  /** Return a node to override how a cell renders; undefined falls back to the default. */
  renderCell?: (column: string, value: string | undefined) => React.ReactNode | undefined;
  extra?: { header: string; cell: (row: Record<string, string>, index: number) => React.ReactNode };
}

function renderValue(column: string, value: string | undefined, types?: Record<string, FieldType>) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const type = types?.[column];
  if (type === "currency" || (!types && AMOUNT_COLUMNS.has(column))) {
    const n = parseAmount(value);
    return n === undefined ? value : formatCurrency(n);
  }
  if (type === "date" || (!types && DATE_COLUMNS.has(column))) return formatDate(normalizeDate(value));
  return value;
}

/** First rows of a parsed file. Expected columns that weren't found are flagged in the header. */
export function PreviewTable({ expected, missing, rows, limit = 5, columnTypes, renderCell, extra }: PreviewTableProps) {
  const shown = rows.slice(0, limit);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Preview · first {Math.min(limit, rows.length)} of {rows.length.toLocaleString("en-US")} rows
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="text-xs">
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              {expected.map((col) => (
                <TableHead key={col} className="h-9 text-xs font-semibold whitespace-nowrap">
                  <span className={cn("inline-flex items-center gap-1", missing.includes(col) && "text-amber-700 dark:text-amber-400")}>
                    {missing.includes(col) && <TriangleAlert className="size-3" aria-label="Missing column" />}
                    {col}
                  </span>
                </TableHead>
              ))}
              {extra && <TableHead className="h-9 text-xs font-semibold whitespace-nowrap">{extra.header}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row, i) => (
              <TableRow key={i}>
                {expected.map((col) => (
                  <TableCell
                    key={col}
                    className={cn("py-2 whitespace-nowrap", (!columnTypes && MONO_COLUMNS.has(col)) && "font-mono text-[11px]", (columnTypes ? columnTypes[col] === "currency" : AMOUNT_COLUMNS.has(col)) && "tabular-nums")}
                  >
                    {renderCell?.(col, row[col]) ?? renderValue(col, row[col], columnTypes)}
                  </TableCell>
                ))}
                {extra && <TableCell className="py-2 whitespace-nowrap">{extra.cell(row, i)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function WarningsNotice({ title, warnings, limit = 5 }: { title: string; warnings: string[]; limit?: number }) {
  if (warnings.length === 0) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <p className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-4 shrink-0" aria-hidden /> {title}
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-9 text-[13px]">
        {warnings.slice(0, limit).map((w) => (
          <li key={w}>{w}</li>
        ))}
        {warnings.length > limit && <li>and {warnings.length - limit} more</li>}
      </ul>
    </div>
  );
}

export function MissingColumnsNotice({
  missing,
  blocking,
  blockingText = "A Claim No column is required before this file can be uploaded.",
}: {
  missing: string[];
  blocking: boolean;
  blockingText?: string;
}) {
  if (missing.length === 0) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Missing columns: {missing.join(", ")}.</span>{" "}
        {blocking ? blockingText : "Those fields will be left blank for every row."}
      </p>
    </div>
  );
}
