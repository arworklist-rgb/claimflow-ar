"use client";

import { useState } from "react";
import { MailPlus, Shield, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDemoStore } from "@/lib/store/demo-store";

const RBAC_ROLES = [
  { key: "super_admin", name: "Super Admin", access: "Platform-wide administration" },
  { key: "org_admin", name: "Organization Admin", access: "Manage organization, practices and users" },
  { key: "manager", name: "Manager", access: "Manage teams, claims and reports" },
  { key: "ar_1", name: "AR 1", access: "Initial claim investigation and follow-ups" },
  { key: "ar_2", name: "AR 2", access: "Advanced investigation and escalations" },
  { key: "viewer", name: "Viewer", access: "Read-only access" },
];

export function UsersRolesView() {
  const users = useDemoStore((s) => s.users);
  const practices = useDemoStore((s) => s.practices);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ar_1");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    toast.success(`Invitation queued for ${inviteEmail} (${inviteRole})`);
    setInviteEmail("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Invite teammates, assign the 6-tier RBAC roles, and scope practice-level access."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Team Members" value={users.length} icon={Users} />
        <StatCard label="Active Users" value={users.filter((u) => u.status === "Active").length} icon={UserCheck} tone="green" />
        <StatCard label="RBAC Roles" value={RBAC_ROLES.length} icon={Shield} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite Employee</CardTitle>
          <CardDescription>Send an organization invitation with pre-assigned role and practice access.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="specialist@billingteam.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-56">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RBAC_ROLES.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <MailPlus className="size-4" /> Send Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Definitions</CardTitle>
            <CardDescription>Enforced on both Next.js API routes and PostgreSQL RLS.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Access Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RBAC_ROLES.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.access}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Users</CardTitle>
            <CardDescription>{practices.length} practices configured for scoped assignment.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-muted-foreground text-xs">{u.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.status === "Active" ? "default" : "secondary"}>{u.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
