"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { LabeledSelect } from "@/components/shared/labeled-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import { formatDate } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Practice, User } from "@/lib/types";
import { AssignedUsers } from "./assigned-users";
import { PracticeDialog } from "./practice-dialog";
import { ViewUsersSheet } from "./view-users-sheet";

interface PracticesTableProps {
  editing: Practice | null;
  onEditingChange: (p: Practice | null) => void;
}

export function PracticesTable({ editing, onEditingChange }: PracticesTableProps) {
  const practices = useDemoStore((s) => s.practices);
  const users = useDemoStore((s) => s.users);
  const deletePractice = useDemoStore((s) => s.deletePractice);

  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState("all");
  const [viewing, setViewing] = useState<Practice | null>(null);
  const [deleting, setDeleting] = useState<Practice | null>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const usersOf = (p: Practice): User[] =>
    p.userIds.map((id) => userById.get(id)).filter((u): u is User => !!u);

  const columns: Column<Practice>[] = [
    {
      id: "name",
      header: "Practice Name",
      sortValue: (p) => p.name,
      cell: (p) => (
        <span className="flex items-center gap-3 font-medium">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
            <Building2 className="size-4" aria-hidden />
          </span>
          <span className="whitespace-nowrap">{p.name}</span>
        </span>
      ),
    },
    { id: "code", header: "Practice ID", sortValue: (p) => p.code, cell: (p) => <span className="font-mono text-[13px]">{p.code}</span> },
    { id: "users", header: "Assigned Users", cell: (p) => <AssignedUsers users={usersOf(p)} /> },
    {
      id: "view",
      header: <span className="sr-only">View users</span>,
      cell: (p) => (
        <button
          type="button"
          onClick={() => setViewing(p)}
          className="inline-flex items-center gap-0.5 rounded text-sm font-medium whitespace-nowrap text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none dark:text-blue-300"
        >
          View Users <ChevronRight className="size-4" aria-hidden />
        </button>
      ),
    },
    { id: "status", header: "Status", sortValue: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
    {
      id: "created",
      header: "Created On",
      sortValue: (p) => p.createdAt,
      cell: (p) => <span className="whitespace-nowrap">{formatDate(p.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      headClassName: "text-center",
      cell: (p) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => onEditingChange(p)}>
            <Pencil />
          </Button>
          <span className="h-4 w-px bg-border" aria-hidden />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${p.name}`}
            className="hover:text-destructive"
            onClick={() => setDeleting(p)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  const table = useDataTable({
    data: practices,
    columns,
    searchText: (p) => `${p.name} ${p.code}`,
    filter: (p) => (status === "all" || p.status === status) && (userId === "all" || p.userIds.includes(userId)),
    filterKey: `${status}|${userId}`,
    initialSort: { id: "created", dir: "desc" },
  });

  return (
    <>
      <DataTable
        table={table}
        columns={columns}
        getRowId={(p) => p.id}
        noun="practices"
        searchPlaceholder="Search practice by name or ID..."
        filters={
          <>
            <LabeledSelect
              aria-label="Filter by status"
              value={status}
              onValueChange={setStatus}
              className="w-40"
              options={[
                { value: "all", label: "All Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
            <LabeledSelect
              aria-label="Filter by assigned user"
              value={userId}
              onValueChange={setUserId}
              className="w-44"
              options={[{ value: "all", label: "All Users" }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
            />
          </>
        }
      />

      <PracticeDialog open={!!editing} onOpenChange={(o) => !o && onEditingChange(null)} practice={editing} />
      <ViewUsersSheet practice={viewing} users={viewing ? usersOf(viewing) : []} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete practice?"
        description={
          <>
            <strong className="text-foreground">{deleting?.name}</strong> ({deleting?.code}) will be removed. Claims already
            uploaded for it stay in the worklist.
          </>
        }
        confirmLabel="Delete practice"
        onConfirm={() => {
          if (!deleting) return;
          deletePractice(deleting.id);
          toast.success(`${deleting.name} deleted`);
        }}
      />
    </>
  );
}
