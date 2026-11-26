"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Building2, CheckCircle2, DollarSign, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUCKETS, ageInDays, balanceOf, bucketOfAge, isClosed, isNotWorked } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

export function OrgAdminDashboard() {
  const claims = useDemoStore((s) => s.claims);
  const practices = useDemoStore((s) => s.practices);
  const users = useDemoStore((s) => s.users);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);

  const scoped = useMemo(
    () => (selectedPracticeId === ALL_PRACTICES ? claims : claims.filter((c) => c.practiceId === selectedPracticeId)),
    [claims, selectedPracticeId],
  );

  const metrics = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let openBalance = 0;
    let closed = 0;
    let untouched = 0;
    const buckets: Record<string, { count: number; balance: number }> = {};
    for (const b of BUCKETS) buckets[b.id] = { count: 0, balance: 0 };

    for (const c of scoped) {
      billed += c.billedAmount ?? 0;
      paid += c.paidAmount ?? 0;
      const bal = balanceOf(c);
      openBalance += bal;
      if (isClosed(c)) closed++;
      if (isNotWorked(c)) untouched++;
      const b = bucketOfAge(ageInDays(c));
      buckets[b].count++;
      buckets[b].balance += bal;
    }

    return {
      openBalance,
      recoveryRate: billed > 0 ? Math.round((paid / billed) * 100) : 0,
      closed,
      untouched,
      buckets,
    };
  }, [scoped]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Admin Dashboard"
        description="Full organization-level AR performance, practice oversight, and operational controls."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/settings/users-roles">Users & Roles</Link></Button>
            <Button asChild><Link href="/upload-claims">Upload Claims</Link></Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open AR Balance" value={formatCurrency(metrics.openBalance)} icon={DollarSign} />
        <StatCard label="Recovery Rate" value={`${metrics.recoveryRate}%`} icon={Activity} tone="green" />
        <StatCard label="Active Practices" value={practices.filter((p) => p.status === "Active").length} icon={Building2} />
        <StatCard label="Active Team" value={users.filter((u) => u.status === "Active").length} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aging Distribution</CardTitle>
            <CardDescription>{scoped.length} claims in scope ({metrics.closed} closed, {metrics.untouched} untouched).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {BUCKETS.map((b) => {
              const row = metrics.buckets[b.id];
              const pct = metrics.openBalance > 0 ? Math.round((row.balance / metrics.openBalance) * 100) : 0;
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{b.label} ({row.count})</span>
                    <span className="font-semibold">{formatCurrency(row.balance)} ({pct}%)</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Governance</CardTitle>
            <CardDescription>Direct shortcuts to organization configuration & audit logs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start" asChild><Link href="/worklist"><CheckCircle2 className="size-4" /> Review All Claims</Link></Button>
            <Button variant="outline" className="justify-start" asChild><Link href="/reconciliation"><DollarSign className="size-4" /> Payment Reconciliation</Link></Button>
            <Button variant="outline" className="justify-start" asChild><Link href="/settings/payers"><Building2 className="size-4" /> Payer Directory</Link></Button>
            <Button variant="outline" className="justify-start" asChild><Link href="/audit-logs"><AlertTriangle className="size-4" /> Audit Logs</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
