import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PageContainer>
      <DashboardView />
    </PageContainer>
  );
}
