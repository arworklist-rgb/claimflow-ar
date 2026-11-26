"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, ShieldAlert, UserCog, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ageInDays, balanceOf, isClosed } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

export function ManagerDashboard() {
  const claims = useDemoStore((s) => s.claims);
  const users = useDemoStore((s) => s.users);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);

  const openClaims = useMemo(
    () =>
      claims
        .filter((c) => !isClosed(c))
        .filter((c) => selectedPracticeId === ALL_PRACTICES || c.practiceId === selectedPracticeId),
    [claims, selectedPracticeId],
  );

  const overdueClaims = useMemo(() => openClaims.filter((c) => (ageInDays(c) ?? 0) > 60), [openClaims]);
  const unassigned = useMemo(() => openClaims.filter((c) => !c.ar1UserId), [openClaims]);

  const teamLoad = useMemo(() => {
    return users
      .filter((u) => u.status === "Active")
      .map((u) => {
        const assigned = openClaims.filter((c) => c.ar1UserId === u.id || c.ar2UserId === u.id);
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          count: assigned.length,
          balance: assigned.reduce((s, c) => s + balanceOf(c), 0),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [users, openClaims]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Operations Dashboard"
        description="Supervise AR 1 & AR 2 workloads, overdue claims, escalations, and team performance."
        actions={<Button asChild><Link href="/ar-management">Manage AR Queue</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Team Claims" value={openClaims.length} icon={UserCog} />
        <StatCard label="Overdue (> 60d)" value={overdueClaims.length} icon={ShieldAlert} tone="blue" />
        <StatCard label="Unassigned Claims" value={unassigned.length} icon={CalendarClock} />
        <StatCard label="Active Specialists" value={teamLoad.length} icon={Users} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Workload Distribution</CardTitle>
          <CardDescription>Open claims and outstanding balance assigned per specialist.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialist</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Open Claims</TableHead>
                <TableHead>Assigned Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamLoad.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{t.role}</Badge></TableCell>
                  <TableCell>{t.count}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(t.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
