"use client";

import { useState } from "react";
import { Building2, CircleCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Practice } from "@/lib/types";
import { PracticeDialog } from "./practice-dialog";
import { PracticesTable } from "./practices-table";
import { UsersTable } from "./users-table";

export function PracticesView() {
  const practices = useDemoStore((s) => s.practices);
  const users = useDemoStore((s) => s.users);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Practice | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice Management"
        description="Create and manage practices and assign users to each practice."
        actions={
          <Button size="lg" onClick={() => setAdding(true)}>
            <Building2 aria-hidden /> + Add Practice
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Practices" value={practices.length} icon={Building2} />
        <StatCard label="Total Users" value={users.length} icon={Users} />
        <StatCard label="Active Practices" value={practices.filter((p) => p.status === "Active").length} icon={CircleCheck} tone="green" />
      </div>

      <Tabs defaultValue="practices" className="gap-4">
        <TabsList variant="line" className="h-11 w-full justify-start gap-2 border-b p-0">
          <TabsTrigger value="practices" className="h-full flex-none gap-2 px-4 text-[15px] font-semibold data-active:text-primary">
            <Building2 aria-hidden /> Practices
          </TabsTrigger>
          <TabsTrigger value="users" className="h-full flex-none gap-2 px-4 text-[15px] font-semibold data-active:text-primary">
            <Users aria-hidden /> Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="practices">
          <PracticesTable editing={editing} onEditingChange={setEditing} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTable />
        </TabsContent>
      </Tabs>

      <PracticeDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
