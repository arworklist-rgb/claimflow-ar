"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useDemoStore } from "@/lib/store/demo-store";
import type { User } from "@/lib/types";

export function UsersTable() {
  const users = useDemoStore((s) => s.users);
  const practices = useDemoStore((s) => s.practices);

  const practicesOf = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of practices) for (const id of p.userIds) map.set(id, [...(map.get(id) ?? []), p.name]);
    return map;
  }, [practices]);

  const assigned = (u: User) => (u.role === "Admin" ? ["All practices"] : (practicesOf.get(u.id) ?? []));

  const columns: Column<User>[] = [
    {
      id: "name",
      header: "User",
      sortValue: (u) => u.name,
      cell: (u) => (
        <span className="flex items-center gap-3 font-medium">
          <UserAvatar user={u} />
          <span className="whitespace-nowrap">{u.name}</span>
        </span>
      ),
    },
    { id: "email", header: "Email", sortValue: (u) => u.email, cell: (u) => <span className="text-muted-foreground">{u.email}</span> },
    {
      id: "role",
      header: "Role",
      sortValue: (u) => u.role,
      cell: (u) => (
        <Badge variant="outline" className="rounded-full text-xs">
          {u.role}
        </Badge>
      ),
    },
    {
      id: "practices",
      header: "Assigned Practices",
      cell: (u) => {
        const names = assigned(u);
        return names.length === 0 ? (
          <span className="text-muted-foreground">Unassigned</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {names.map((n) => (
              <Badge key={n} variant="secondary" className="rounded-md bg-muted font-medium whitespace-nowrap">
                {n}
              </Badge>
            ))}
          </span>
        );
      },
    },
    { id: "status", header: "Status", sortValue: (u) => u.status, cell: (u) => <StatusBadge status={u.status} /> },
  ];

  const table = useDataTable({
    data: users,
    columns,
    searchText: (u) => `${u.name} ${u.email} ${u.role} ${assigned(u).join(" ")}`,
    initialSort: { id: "name", dir: "asc" },
  });

  return (
    <DataTable
      table={table}
      columns={columns}
      getRowId={(u) => u.id}
      noun="users"
      searchPlaceholder="Search users by name, email or role..."
    />
  );
}
