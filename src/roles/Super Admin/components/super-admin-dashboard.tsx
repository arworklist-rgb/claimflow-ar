"use client";

import { useEffect, useState } from "react";
import { Building2, FileCheck2, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrgRow {
  id: string;
  name: string;
  npi?: string;
  status: string;
  created_at: string;
}

export function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [stats, setStats] = useState({ totalOrganizations: 1, totalUsers: 12, totalClaims: 0 });

  useEffect(() => {
    fetch("/api/v1/platform/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && j.data) setStats(j.data);
      })
      .catch(() => {});

    fetch("/api/v1/platform/organizations")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && Array.isArray(j.data)) setOrgs(j.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Console"
        description="Platform-wide multi-organization administration, system health, and global audit oversight."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={orgs.length || stats.totalOrganizations} icon={Building2} />
        <StatCard label="Global Users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Platform Claims" value={stats.totalClaims} icon={FileCheck2} />
        <StatCard label="System Health" value="Healthy" icon={ShieldCheck} tone="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations Directory</CardTitle>
          <CardDescription>Isolated tenants managed at the platform level.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center text-sm py-6">
                    Sign in as Super Admin with Supabase configured to manage live platform organizations.
                  </TableCell>
                </TableRow>
              ) : (
                orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell className="font-mono text-sm">{o.npi ?? "—"}</TableCell>
                    <TableCell><Badge>{o.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
