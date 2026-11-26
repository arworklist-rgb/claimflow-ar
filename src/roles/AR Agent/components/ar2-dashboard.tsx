"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DollarSign, FileWarning, ShieldAlert, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ageInDays, balanceOf, isClosed } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";

export function Ar2Dashboard() {
  const { userId, fullName } = useAuth();
  const claims = useDemoStore((s) => s.claims);

  const escalated = useMemo(
    () => claims.filter((c) => !isClosed(c) && (c.ar2UserId === userId || (ageInDays(c) ?? 0) > 60)),
    [claims, userId],
  );

  const above60 = useMemo(() => escalated.filter((c) => (ageInDays(c) ?? 0) > 60), [escalated]);
  const recovered = useMemo(
    () => claims.filter((c) => c.ar2UserId === userId && isClosed(c)).reduce((s, c) => s + (c.paidAmount ?? 0), 0),
    [claims, userId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`AR 2 Recovery Console — ${fullName}`}
        description="Complex denials, 60+ day aged claims, formal appeal workflows, and payer escalations."
        actions={<Button asChild><Link href="/ar-management">Open Escalation Queue</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Escalated / AR 2 Queue" value={escalated.length} icon={ShieldAlert} />
        <StatCard label="Above 60 Days" value={above60.length} icon={FileWarning} tone="blue" />
        <StatCard label="At-Risk Balance" value={formatCurrency(escalated.reduce((s, c) => s + balanceOf(c), 0))} icon={DollarSign} />
        <StatCard label="Recovered (Closed)" value={formatCurrency(recovered)} icon={TrendingUp} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>High-Age & Escalated Claims</CardTitle>
          <CardDescription>Prioritized for appeal submission and corrected claim tracking.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Denial Codes</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escalated.slice(0, 10).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                  <TableCell>{c.patientName}</TableCell>
                  <TableCell><Badge variant="destructive">{ageInDays(c) ?? 0}d</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{c.denialCodes.join(", ") || "—"}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(balanceOf(c))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
