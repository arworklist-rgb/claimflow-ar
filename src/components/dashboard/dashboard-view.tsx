"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/use-auth";
import { Ar1Dashboard, Ar2Dashboard } from "@/roles/AR Agent";
import { ManagerDashboard } from "@/roles/Manager";
import { OrgAdminDashboard } from "@/roles/Organization Admin";
import { SuperAdminDashboard } from "@/roles/Super Admin";
import { ViewerDashboard } from "@/roles/Viewer";

export function DashboardView() {
  const { loading, roleKey } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  switch (roleKey) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "org_admin":
      return <OrgAdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "ar_1":
      return <Ar1Dashboard />;
    case "ar_2":
      return <Ar2Dashboard />;
    case "viewer":
    default:
      return <ViewerDashboard />;
  }
}
