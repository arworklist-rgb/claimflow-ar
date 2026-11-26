"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);

  useEffect(() => {
    fetch("/api/v1/audit-logs")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.ok && Array.isArray(j.data)) setLogs(j.data);
      })
      .catch(() => {});
  }, []);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable HIPAA-oriented activity trail for claim updates, document downloads, and RBAC changes."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Security & Activity Events
          </CardTitle>
          <CardDescription>Scoped to your organization (or platform-wide for Super Admin).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                    Sign in with Supabase Auth to view live audit log entries.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{l.action}</Badge></TableCell>
                    <TableCell className="font-medium">{l.resource_type}</TableCell>
                    <TableCell className="font-mono text-xs">{l.resource_id ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
