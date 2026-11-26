"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CalendarClock, ShieldAlert, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ageInDays, balanceOf, isClosed } from "@/lib/claims";
import { formatCurrency } from "@/lib/format";
import { ALL_PRACTICES, useDemoStore } from "@/lib/store/demo-store";

export function ArManagementView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "assignments";
  const activeTab = ["assignments", "followups", "escalations"].includes(tabParam) ? tabParam : "assignments";

  const claims = useDemoStore((s) => s.claims);
  const users = useDemoStore((s) => s.users);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);
  const assignClaim = useDemoStore((s) => s.assignClaim);
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const openClaims = useMemo(() => {
    return claims
      .filter((c) => !isClosed(c))
      .filter((c) => selectedPracticeId === ALL_PRACTICES || c.practiceId === selectedPracticeId)
      .filter((c) => assigneeFilter === "all" || c.ar1UserId === assigneeFilter || c.ar2UserId === assigneeFilter)
      .sort((a, b) => (ageInDays(b) ?? 0) - (ageInDays(a) ?? 0));
  }, [claims, selectedPracticeId, assigneeFilter]);

  const agedOver60 = useMemo(() => openClaims.filter((c) => (ageInDays(c) ?? 0) > 60), [openClaims]);
  const escalatedClaims = useMemo(() => openClaims.filter((c) => Boolean(c.ar2UserId) || (ageInDays(c) ?? 0) > 60), [openClaims]);

  function handleReassign(claimId: string, userId: string) {
    const userName = users.find((u) => u.id === userId)?.name ?? "Specialist";
    assignClaim(claimId, "ar1", userId);
    toast.success(`Reassigned AR 1 to ${userName}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AR Management"
        description="Prioritized open AR queue, specialist assignments, follow-up tasks, and aged escalation tracking."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open AR Queue" value={openClaims.length} icon={UserCog} />
        <StatCard label="Aged > 60 Days" value={agedOver60.length} icon={CalendarClock} tone="blue" />
        <StatCard
          label="Open Queue Balance"
          value={formatCurrency(openClaims.reduce((sum, c) => sum + balanceOf(c), 0))}
          icon={ArrowUpRight}
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(next) => router.replace(`/ar-management?tab=${next}`)}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="assignments">AR Assignments</TabsTrigger>
            <TabsTrigger value="followups">Follow-up Tasks</TabsTrigger>
            <TabsTrigger value="escalations">Escalations ({escalatedClaims.length})</TabsTrigger>
          </TabsList>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by AR Specialist" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialists</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>AR 1 & AR 2 Assignment Queue</CardTitle>
              <CardDescription>Assign or reassign claims to AR specialists.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>AR 1 Assignment</TableHead>
                    <TableHead>AR 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openClaims.slice(0, 25).map((c) => {
                    const age = ageInDays(c) ?? 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                        <TableCell>{c.patientName}</TableCell>
                        <TableCell><Badge variant={age > 60 ? "destructive" : "secondary"}>{age}d</Badge></TableCell>
                        <TableCell className="font-semibold">{formatCurrency(balanceOf(c))}</TableCell>
                        <TableCell><Badge variant="outline">{c.action}</Badge></TableCell>
                        <TableCell>
                          <Select value={c.ar1UserId ?? ""} onValueChange={(val) => handleReassign(c.id, val)}>
                            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Assign AR 1" /></SelectTrigger>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.ar2UserId ? (
                            users.find((u) => u.id === c.ar2UserId)?.name ?? c.ar2UserId
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => assignClaim(c.id, "ar2", users[0]?.id ?? null)}>
                              Escalate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Follow-up Tasks</CardTitle>
              <CardDescription>Claims awaiting payer follow-up or status verification.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Assigned AR 1</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openClaims.slice(0, 20).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                      <TableCell>{c.patientName}</TableCell>
                      <TableCell><Badge variant="outline">{c.action}</Badge></TableCell>
                      <TableCell>{users.find((u) => u.id === c.ar1UserId)?.name ?? "Unassigned"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(balanceOf(c))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" /> Escalated & Aged (&gt;60d) Claims
              </CardTitle>
              <CardDescription>Claims requiring AR 2 appeal management or supervisor review.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>AR 2 Specialist</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalatedClaims.slice(0, 20).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-medium">{c.claimId}</TableCell>
                      <TableCell>{c.patientName}</TableCell>
                      <TableCell><Badge variant="destructive">{ageInDays(c) ?? 0}d</Badge></TableCell>
                      <TableCell>{users.find((u) => u.id === c.ar2UserId)?.name ?? "Pending AR 2"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(balanceOf(c))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
