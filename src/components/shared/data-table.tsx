"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PAGE_SIZES, type Column, type DataTableState } from "./use-data-table";

export interface RowSelection {
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

interface DataTableProps<T> {
  table: DataTableState<T>;
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** Plural noun for the footer, e.g. "practices". */
  noun: string;
  searchPlaceholder?: string;
  /** Page-specific filter controls, rendered to the right of the search box. */
  filters?: React.ReactNode;
  /** Rendered at the start of the footer (e.g. bulk actions). */
  footerStart?: React.ReactNode;
  emptyState?: React.ReactNode;
  selection?: RowSelection;
  hideToolbar?: boolean;
  /** Makes rows clickable (and keyboard-activatable). */
  onRowClick?: (row: T) => void;
  /** Row id to highlight as the current selection. */
  activeRowId?: string;
  /** Extra classes for the search + filters bar. */
  toolbarClassName?: string;
  /** Renders just the table + pager, without the outer card chrome. */
  className?: string;
  /** Freezes the header row: the rows scroll underneath it (the table scrolls inside a viewport-high box). */
  stickyHeader?: boolean;
}

/** Pinned columns need an opaque background that still follows the row's hover / selected tint. */
/** The frozen header row: stays at the top of the scrolling table, with an opaque background and a bottom rule. */
const STICKY_TOP =
  "sticky top-0 z-20 bg-[color-mix(in_oklab,var(--card),var(--muted)_50%)] shadow-[0_1px_0_var(--border)]";
const STICKY_HEAD =
  "sticky z-30 bg-[color-mix(in_oklab,var(--card),var(--muted)_50%)] shadow-[1px_0_0_var(--border)]";
const STICKY_HEAD_RIGHT =
  "sticky right-0 z-30 bg-[color-mix(in_oklab,var(--card),var(--muted)_50%)] shadow-[-1px_0_0_var(--border)]";
const STICKY_CELL_RIGHT =
  "sticky right-0 z-10 bg-card shadow-[-1px_0_0_var(--border)] group-hover/row:bg-muted group-data-[state=selected]/row:bg-brand-soft";
const STICKY_CELL =
  "sticky z-10 bg-card shadow-[1px_0_0_var(--border)] group-hover/row:bg-muted group-data-[state=selected]/row:bg-brand-soft";

function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function DataTable<T>({
  table,
  columns,
  getRowId,
  noun,
  searchPlaceholder = "Search…",
  filters,
  footerStart,
  emptyState,
  selection,
  hideToolbar,
  onRowClick,
  activeRowId,
  toolbarClassName,
  className,
  stickyHeader,
}: DataTableProps<T>) {
  const { rows } = table;
  const pageIds = rows.map(getRowId);
  const selectedOnPage = selection ? pageIds.filter((id) => selection.selected.has(id)).length : 0;
  const allOnPage = pageIds.length > 0 && selectedOnPage === pageIds.length;

  const toggleAll = (checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    selection.onChange(next);
  };
  const toggleOne = (id: string, checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (checked) next.add(id);
    else next.delete(id);
    selection.onChange(next);
  };

  const colSpan = columns.length + (selection ? 1 : 0);
  // An id can't contain spaces ("denial codes"), or the label would never resolve.
  const rppId = `${noun.replace(/\s+/g, "-")}-rpp`;

  return (
    <Card className={cn("gap-0 py-0", className)}>
      {!hideToolbar && (
        <div className={cn("flex flex-wrap items-center gap-3 border-b px-4 py-3.5 sm:px-5", toolbarClassName)}>
          <div className="relative w-full min-w-0 sm:min-w-52 sm:flex-1 sm:basis-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={table.query}
              onChange={(e) => table.setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="bg-card pl-9"
            />
          </div>
          {filters && <div className="grid w-full grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">{filters}</div>}
        </div>
      )}

      <div className={stickyHeader ? undefined : "overflow-x-auto"}>
        <Table containerClassName={stickyHeader ? "max-h-[calc(100dvh-9rem)] min-h-64 overflow-auto" : undefined}>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              {selection && (
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Select all rows on this page"
                    checked={allOnPage ? true : selectedOnPage > 0 ? "indeterminate" : false}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    disabled={rows.length === 0}
                  />
                </TableHead>
              )}
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const active = table.sort?.id === col.id;
                return (
                  <TableHead
                    key={col.id}
                    aria-sort={active ? (table.sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                    style={col.stickyLeft !== undefined ? { left: col.stickyLeft } : undefined}
                    className={cn(
                      "h-11 px-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase first:pl-4 last:pr-4",
                      stickyHeader && STICKY_TOP,
                      active && "text-foreground",
                      col.stickyLeft !== undefined && STICKY_HEAD,
                      col.stickyRight && STICKY_HEAD_RIGHT,
                      col.headClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => table.toggleSort(col.id)}
                        className="-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 uppercase transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {col.header}
                        {active ? (
                          table.sort?.dir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden />
                          )
                        ) : (
                          <ArrowUp className="size-3.5 opacity-25" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="p-0">
                  {emptyState ?? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No {noun} found.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const checked = selection?.selected.has(id) ?? false;
                return (
                  <TableRow
                    key={id}
                    data-state={checked || id === activeRowId ? "selected" : undefined}
                    aria-selected={id === activeRowId || undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "group/row h-[3.75rem] border-border/60",
                      onRowClick && "cursor-pointer outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      id === activeRowId &&
                        "bg-brand-soft/70 hover:bg-brand-soft/70 [&>td:first-child]:shadow-[inset_3px_0_0_var(--primary)]",
                    )}
                  >
                    {selection && (
                      <TableCell className="w-10 pl-4">
                        <Checkbox
                          aria-label={`Select row ${id}`}
                          checked={checked}
                          onCheckedChange={(v) => toggleOne(id, v === true)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        style={col.stickyLeft !== undefined ? { left: col.stickyLeft } : undefined}
                        className={cn("px-2.5 py-2.5 first:pl-4 last:pr-4", col.stickyLeft !== undefined && STICKY_CELL, col.stickyRight && STICKY_CELL_RIGHT, col.className)}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t bg-muted/30 px-4 py-3 text-sm sm:px-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {footerStart}
          <p className="text-muted-foreground" aria-live="polite">
            {table.total === 0
              ? `Showing 0 of 0 ${noun}`
              : `Showing ${table.from} – ${table.to} of ${table.total} ${noun}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <nav aria-label="Pagination" className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={table.page <= 1}
              onClick={() => table.setPage(table.page - 1)}
            >
              <ChevronLeft />
            </Button>
            {pageWindow(table.page, table.pageCount).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  size="icon-sm"
                  variant={p === table.page ? "default" : "outline"}
                  aria-label={`Page ${p}`}
                  aria-current={p === table.page ? "page" : undefined}
                  className={cn("tabular-nums", p !== table.page && "border-transparent bg-transparent")}
                  onClick={() => table.setPage(p)}
                >
                  {p}
                </Button>
              ),
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={table.page >= table.pageCount}
              onClick={() => table.setPage(table.page + 1)}
            >
              <ChevronRight />
            </Button>
          </nav>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span id={`${rppId}`}>Rows per page:</span>
            <Select value={String(table.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="w-[4.5rem] bg-card text-foreground" aria-labelledby={rppId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
