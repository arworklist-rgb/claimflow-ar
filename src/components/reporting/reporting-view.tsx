"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChartColumn, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { balanceOf, isClosed } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

export function ReportingView() {
  const searchParams = useSearchParams();
  const groupParam = searchParams.get("group");
  const initialGroup = groupParam === "ar1" || groupParam === "action" ? groupParam : "practice";

  const claims = useDemoStore((s) => s.claims);
  const practices = useDemoStore((s) => s.practices);
  const users = useDemoStore((s) => s.users);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);
  const [groupBy, setGroupBy] = useState<"practice" | "action" | "ar1">(initialGroup);

  const scopedClaims = useMemo(
    () =>
      selectedPracticeId === ALL_PRACTICES
        ? claims
        : claims.filter((c) => c.practiceId === selectedPracticeId),
    [claims, selectedPracticeId],
  );

  const rows = useMemo(() => {
    const map = new Map<string, { label: string; count: number; billed: number; paid: number; open: number; closed: number }>();

    for (const c of scopedClaims) {
      const key =
        groupBy === "practice"
          ? practices.find((p) => p.id === c.practiceId)?.name ?? "Unknown Practice"
          : groupBy === "action"
            ? c.action
            : users.find((u) => u.id === c.ar1UserId)?.name || "Unassigned";

      const entry = map.get(key) ?? { label: key, count: 0, billed: 0, paid: 0, open: 0, closed: 0 };
      entry.count++;
      entry.billed += c.billedAmount ?? 0;
      entry.paid += c.paidAmount ?? 0;
      entry.open += balanceOf(c);
      if (isClosed(c)) entry.closed++;
      map.set(key, entry);
    }

    return Array.from(map.values()).sort((a, b) => b.open - a.open);
  }, [scopedClaims, practices, users, groupBy]);

  function handleExportCsv() {
    const header = ["Group", "Claims", "Billed", "Paid", "Open Balance", "Closed"];
    const lines = [
      header.join(","),
      ...rows.map((r) => [
        `"${r.label.replace(/"/g, '""')}"`,
        r.count,
        r.billed.toFixed(2),
        r.paid.toFixed(2),
        r.open.toFixed(2),
        r.closed,
      ].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claimflow-report-${groupBy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported to CSV");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting"
        description="Recovery rates, collector productivity, and practice/payer scorecards with CSV export."
        actions={
          <Button onClick={handleExportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartColumn className="size-4" /> Summary Scorecard
            </CardTitle>
            <CardDescription>Aggregated across {scopedClaims.length} claims in the selected scope.</CardDescription>
          </div>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "practice" | "action" | "ar1")}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">Group by Practice</SelectItem>
              <SelectItem value="action">Group by Claim Action</SelectItem>
              <SelectItem value="ar1">Group by AR 1 Specialist</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Total Claims</TableHead>
                <TableHead>Total Billed</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Open Balance</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell>{r.count}</TableCell>
                  <TableCell>{formatCurrency(r.billed)}</TableCell>
                  <TableCell>{formatCurrency(r.paid)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(r.open)}</TableCell>
                  <TableCell>{r.closed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
