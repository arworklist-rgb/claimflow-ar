"use client";

import { useMemo } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { UploadStatusBadge } from "@/components/shared/status-badge";
import { useDataTable, type Column } from "@/components/shared/use-data-table";
import { formatDate } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import type { UploadLog } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecentUploads() {
  const logs = useDemoStore((s) => s.uploadLogs);

  const columns = useMemo<Column<UploadLog>[]>(
    () => [
      {
        id: "file",
        header: "File name",
        sortValue: (r) => r.fileName,
        cell: (r) => (
          <span className="flex items-center gap-2.5 font-medium">
            <FileSpreadsheet className={cn("size-4 shrink-0", r.type === "Paid" ? "text-success" : "text-primary")} aria-hidden />
            <span className="max-w-64 truncate" title={r.fileName}>
              {r.fileName}
            </span>
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: (r) => (
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full border-transparent text-xs font-semibold",
              r.type === "Paid" ? "bg-success-soft text-success" : "bg-brand-soft text-brand-soft-foreground",
            )}
          >
            {r.type}
          </Badge>
        ),
      },
      { id: "practice", header: "Practice", cell: (r) => <span className="whitespace-nowrap">{r.practiceName}</span> },
      { id: "rows", header: "Rows", className: "tabular-nums", cell: (r) => r.rows.toLocaleString("en-US") },
      { id: "by", header: "Uploaded by", cell: (r) => <span className="whitespace-nowrap">{r.uploadedBy}</span> },
      {
        id: "date",
        header: "Date",
        sortValue: (r) => r.uploadedAt,
        cell: (r) => <span className="whitespace-nowrap">{formatDate(r.uploadedAt)}</span>,
      },
      { id: "status", header: "Status", cell: (r) => <UploadStatusBadge status={r.status} /> },
    ],
    [],
  );

  const table = useDataTable({
    data: logs,
    columns,
    initialSort: { id: "date", dir: "desc" },
    initialPageSize: 10,
  });

  return (
    <section aria-labelledby="recent-uploads" className="space-y-3">
      <h2 id="recent-uploads" className="text-lg font-bold tracking-tight">
        Recent uploads
      </h2>
      <DataTable table={table} columns={columns} getRowId={(r) => r.id} noun="uploads" hideToolbar />
    </section>
  );
}
