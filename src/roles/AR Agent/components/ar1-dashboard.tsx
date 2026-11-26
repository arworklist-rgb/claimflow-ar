"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, DollarSign, Sparkles } from "lucide-react";
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

export function Ar1Dashboard() {
  const { userId, fullName } = useAuth();
  const claims = useDemoStore((s) => s.claims);

  const myClaims = useMemo(
    () => claims.filter((c) => !isClosed(c) && c.ar1UserId === userId),
    [claims, userId],
  );
  const newClaims = useMemo(() => myClaims.filter((c) => c.action === "New"), [myClaims]);
  const thirtyDay = useMemo(() => myClaims.filter((c) => (ageInDays(c) ?? 0) <= 30), [myClaims]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`AR 1 Workspace — ${fullName}`}
        description="Initial claim investigation, CARC/RARC denial review, payer follow-ups, and escalations."
        actions={<Button asChild><Link href="/worklist">Open My Worklist</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Assigned Claims" value={myClaims.length} icon={ClipboardList} />
        <StatCard label="New Claims" value={newClaims.length} icon={Sparkles} tone="blue" />
        <StatCard label="0–30 Day Aging" value={thirtyDay.length} icon={CalendarClock} />
        <StatCard label="My Open Balance" value={formatCurrency(myClaims.reduce((s, c) => s + balanceOf(c), 0))} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priority Initial Follow-Ups</CardTitle>
          <CardDescription>Claims currently assigned to you as AR 1.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myClaims.slice(0, 10).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                  <TableCell>{c.patientName}</TableCell>
                  <TableCell>{ageInDays(c) ?? 0}d</TableCell>
                  <TableCell><Badge variant="outline">{c.action}</Badge></TableCell>
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
