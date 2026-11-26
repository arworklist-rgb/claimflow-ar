"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Building2, ChartColumn, CheckCircle2, DollarSign, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { balanceOf, isClosed } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

export function ViewerDashboard() {
  const claims = useDemoStore((s) => s.claims);
  const practices = useDemoStore((s) => s.practices);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);

  const scoped = useMemo(
    () => (selectedPracticeId === ALL_PRACTICES ? claims : claims.filter((c) => c.practiceId === selectedPracticeId)),
    [claims, selectedPracticeId],
  );

  const totalOpen = useMemo(() => scoped.reduce((s, c) => s + balanceOf(c), 0), [scoped]);
  const closedCount = useMemo(() => scoped.filter((c) => isClosed(c)).length, [scoped]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview (Read-Only)"
        description="Read-only financial AR summaries, practice performance, and authorized reports."
        actions={
          <Button variant="outline" asChild>
            <Link href="/reporting"><ChartColumn className="size-4" /> View Reports</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Authorized Claims" value={scoped.length} icon={Eye} />
        <StatCard label="Outstanding AR" value={formatCurrency(totalOpen)} icon={DollarSign} />
        <StatCard label="Settled Claims" value={closedCount} icon={CheckCircle2} tone="green" />
        <StatCard label="Practices" value={practices.length} icon={Building2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice Financial Summary</CardTitle>
          <CardDescription>Read-only breakdown across authorized practices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {practices.map((p) => {
            const pClaims = scoped.filter((c) => c.practiceId === p.id);
            const bal = pClaims.reduce((s, c) => s + balanceOf(c), 0);
            return (
              <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground text-xs">{pClaims.length} claims</div>
                </div>
                <span className="font-semibold">{formatCurrency(bal)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
