"use client";

import { useState } from "react";
import { Copy, EllipsisVertical, Pencil, Power, PowerOff, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LabeledSelect } from "@/components/shared/labeled-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import { codeSortKey, shortDescription } from "@/lib/denial-codes";
import { pluralize } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { DENIAL_CATEGORIES, type DenialCode } from "@/lib/types";
import { CategoryBadge } from "./category-badge";
import { DenialCodeDialog } from "./denial-code-dialog";

type BulkAction = "activate" | "deactivate" | "delete";

interface DenialCodesTableProps {
  isAdmin: boolean;
  editing: DenialCode | null;
  onEditingChange: (r: DenialCode | null) => void;
}

export function DenialCodesTable({ isAdmin, editing, onEditingChange }: DenialCodesTableProps) {
  const codes = useDemoStore((s) => s.denialCodes);
  const claims = useDemoStore((s) => s.claims);
  const setStatusFor = useDemoStore((s) => s.setDenialCodeStatus);
  const duplicate = useDemoStore((s) => s.duplicateDenialCode);
  const deleteCodes = useDemoStore((s) => s.deleteDenialCodes);

  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>("activate");
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  // Selection can only ever contain rows that still exist.
  const liveSelected = new Set([...selected].filter((id) => codes.some((r) => r.id === id)));

  /** How many claims carry any of these codes (shown before deleting). */
  const claimsUsing = (ids: string[]) => {
    const wanted = new Set(codes.filter((c) => ids.includes(c.id)).map((c) => c.code));
    return claims.filter((c) => c.denialCodes.some((x) => wanted.has(x))).length;
  };
  const usedOn = pendingDelete ? claimsUsing(pendingDelete) : 0;

  const columns: Column<DenialCode>[] = [
    {
      id: "code",
      header: "Code",
      sortValue: (r) => codeSortKey(r.code),
      cell: (r) => <span className="font-mono text-[13px] font-semibold">{r.code}</span>,
    },
    {
      id: "description",
      header: "Description",
      sortValue: (r) => shortDescription(r.description),
      className: "min-w-72 max-w-xl whitespace-normal",
      cell: (r) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="line-clamp-2 cursor-default leading-snug">{shortDescription(r.description)}</p>
          </TooltipTrigger>
          <TooltipContent className="max-w-md text-left leading-relaxed">{r.description}</TooltipContent>
        </Tooltip>
      ),
    },
    { id: "category", header: "Category", sortValue: (r) => r.category, cell: (r) => <CategoryBadge category={r.category} /> },
    { id: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: "Actions",
            headClassName: "text-center",
            cell: (r: DenialCode) => (
              <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.code}`} onClick={() => onEditingChange(r)}>
                  <Pencil />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${r.code}`}>
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {r.status === "Active" ? (
                      <DropdownMenuItem
                        onSelect={() => {
                          setStatusFor([r.id], "Inactive");
                          toast.success(`${r.code} deactivated`);
                        }}
                      >
                        <PowerOff /> Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onSelect={() => {
                          setStatusFor([r.id], "Active");
                          toast.success(`${r.code} activated`);
                        }}
                      >
                        <Power /> Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => {
                        const copy = duplicate(r.id);
                        if (copy) toast.success(`Duplicated ${r.code} as ${copy.code}`);
                      }}
                    >
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete([r.id])}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ),
          } satisfies Column<DenialCode>,
        ]
      : []),
  ];

  const table = useDataTable({
    data: codes,
    columns,
    searchText: (r) => `${r.code} ${r.description}`,
    filter: (r) => (status === "all" || r.status === status) && (category === "all" || r.category === category),
    filterKey: `${status}|${category}`,
    initialSort: { id: "code", dir: "asc" },
  });

  const applyBulk = () => {
    const ids = [...liveSelected];
    if (ids.length === 0) return;
    if (bulkAction === "delete") {
      setPendingDelete(ids);
      return;
    }
    const next = bulkAction === "activate" ? "Active" : "Inactive";
    setStatusFor(ids, next);
    toast.success(`${ids.length} ${pluralize(ids.length, "code")} ${bulkAction}d`);
    setSelected(new Set());
  };

  return (
    <>
      <DataTable
        table={table}
        columns={columns}
        getRowId={(r) => r.id}
        noun="denial codes"
        searchPlaceholder="Search by code or description..."
        selection={isAdmin ? { selected: liveSelected, onChange: setSelected } : undefined}
        emptyState={
          <EmptyState
            icon={Tag}
            title="No denial codes found"
            description="Try a different search term, or clear the status and category filters."
          />
        }
        filters={
          <>
            <LabeledSelect
              label="Status:"
              value={status}
              onValueChange={setStatus}
              className="w-44"
              options={[
                { value: "all", label: "All" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
            <LabeledSelect
              label="Category:"
              value={category}
              onValueChange={setCategory}
              className="w-72"
              options={[{ value: "all", label: "All" }, ...DENIAL_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
          </>
        }
        footerStart={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <span id="bulk-actions-label" className="font-medium text-foreground/80">
                Bulk Actions:
              </span>
              <Select value={bulkAction} onValueChange={(v) => setBulkAction(v as BulkAction)}>
                <SelectTrigger size="sm" className="w-32 bg-card" aria-labelledby="bulk-actions-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="secondary" disabled={liveSelected.size === 0} onClick={applyBulk}>
                Apply{liveSelected.size > 0 && ` (${liveSelected.size})`}
              </Button>
            </div>
          ) : undefined
        }
      />

      {isAdmin && (
        <>
          <DenialCodeDialog open={!!editing} onOpenChange={(o) => !o && onEditingChange(null)} code={editing} />
          <ConfirmDialog
            open={!!pendingDelete}
            onOpenChange={(o) => !o && setPendingDelete(null)}
            title={`Delete ${pendingDelete?.length ?? 0} denial ${pluralize(pendingDelete?.length ?? 0, "code")}?`}
            description={
              <>
                {usedOn > 0 && (
                  <span className="mb-1 block font-semibold text-destructive">
                    {(pendingDelete?.length ?? 0) === 1 ? "This code is" : "These codes are"} used on {usedOn} {pluralize(usedOn, "claim")}.
                    {" "}It will be removed from {usedOn === 1 ? "that claim" : "those claims"}.
                  </span>
                )}
                This can&apos;t be undone, but you can restore the originals any time from Reset demo data.
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              if (!pendingDelete) return;
              deleteCodes(pendingDelete);
              setSelected(new Set());
              toast.success(`${pendingDelete.length} denial ${pluralize(pendingDelete.length, "code")} deleted`);
            }}
          />
        </>
      )}
    </>
  );
}
